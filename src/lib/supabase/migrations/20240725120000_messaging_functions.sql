
-- Create the custom type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_type') THEN
        CREATE TYPE public.conversation_type AS ENUM ('direct', 'group');
    END IF;
END$$;

-- Alter the column type if it's not already the correct type
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='conversations' AND column_name='type' AND udt_name != 'conversation_type'
    ) THEN
        ALTER TABLE public.conversations ALTER COLUMN type TYPE public.conversation_type USING type::text::public.conversation_type;
    END IF;
END$$;


-- Function to get all conversations for a user with participant details and last message
CREATE OR REPLACE FUNCTION public.get_user_conversations_with_details(p_user_id uuid)
RETURNS TABLE(
    id uuid,
    type public.conversation_type,
    name text,
    participants jsonb,
    last_message jsonb,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH user_convos AS (
        SELECT conversation_id
        FROM public.conversation_participants
        WHERE user_id = p_user_id
    ),
    convo_participants AS (
        SELECT
            cp.conversation_id,
            jsonb_agg(jsonb_build_object(
                'id', u.id,
                'name', u.raw_user_meta_data->>'full_name',
                'email', u.email,
                'role', u.raw_user_meta_data->>'role',
                'avatarUrl', 'https://placehold.co/100x100.png'
            )) AS participants
        FROM public.conversation_participants cp
        JOIN auth.users u ON cp.user_id = u.id
        WHERE cp.conversation_id IN (SELECT conversation_id FROM user_convos)
        GROUP BY cp.conversation_id
    ),
    last_messages AS (
        SELECT
            m.conversation_id,
            jsonb_build_object(
                'content', m.content,
                'timestamp', m.created_at
            ) AS last_message
        FROM (
            SELECT
                conversation_id,
                content,
                created_at,
                ROW_NUMBER() OVER(PARTITION BY conversation_id ORDER BY created_at DESC) as rn
            FROM public.messages
            WHERE conversation_id IN (SELECT conversation_id FROM user_convos)
        ) m
        WHERE m.rn = 1
    )
    SELECT
        c.id,
        c.type,
        c.name,
        cp.participants,
        lm.last_message,
        c.created_at
    FROM public.conversations c
    JOIN convo_participants cp ON c.id = cp.conversation_id
    LEFT JOIN last_messages lm ON c.id = lm.conversation_id
    WHERE c.id IN (SELECT conversation_id FROM user_convos)
    ORDER BY lm.last_message->>'timestamp' DESC NULLS LAST;
END;
$$;


-- Function to check for an existing direct message conversation between two users
CREATE OR REPLACE FUNCTION public.get_existing_direct_conversation(user_id_1 uuid, user_id_2 uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    conversation_uuid uuid;
BEGIN
    SELECT c.id INTO conversation_uuid
    FROM public.conversations c
    WHERE c.type = 'direct'::public.conversation_type AND (
        SELECT count(*)
        FROM public.conversation_participants cp
        WHERE cp.conversation_id = c.id AND (cp.user_id = user_id_1 OR cp.user_id = user_id_2)
    ) = 2
    LIMIT 1;

    RETURN conversation_uuid;
END;
$$;
