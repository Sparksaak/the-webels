-- Create the ENUM type for conversation type
CREATE TYPE public.conversation_type AS ENUM ('direct', 'group');

-- Alter the table to use the new type
-- Note: This assumes the 'type' column exists and is of a text-like type.
-- If the table is empty, this is safe. If it has data, ensure data is 'direct' or 'group'.
ALTER TABLE public.conversations ALTER COLUMN type TYPE public.conversation_type USING type::public.conversation_type;

-- Function to get all conversations for a user with participant and last message details
CREATE OR REPLACE FUNCTION get_user_conversations_with_details(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    type public.conversation_type,
    participants JSONB,
    last_message JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    WITH user_convos AS (
        -- Get all conversation IDs for the user
        SELECT conversation_id FROM public.conversation_participants WHERE user_id = p_user_id
    ),
    convo_participants AS (
        -- Get all participants for each conversation
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
        -- Get the last message for each conversation
        SELECT
            conversation_id,
            jsonb_build_object(
                'content', content,
                'timestamp', created_at
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
        WHERE rn = 1
    )
    -- Final SELECT to join everything together
    SELECT
        c.id,
        c.name,
        c.type,
        cp.participants,
        lm.last_message,
        c.created_at
    FROM public.conversations c
    JOIN convo_participants cp ON c.id = cp.conversation_id
    LEFT JOIN last_messages lm ON c.id = lm.conversation_id
    WHERE c.id IN (SELECT conversation_id FROM user_convos)
    ORDER BY (lm.last_message->>'timestamp')::TIMESTAMPTZ DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to check if a direct message conversation already exists between two users
CREATE OR REPLACE FUNCTION get_existing_direct_conversation(user_id_1 UUID, user_id_2 UUID)
RETURNS UUID AS $$
DECLARE
    conversation_uuid UUID;
BEGIN
    SELECT c.id INTO conversation_uuid
    FROM public.conversations c
    WHERE c.type = 'direct'::public.conversation_type
    AND (
        SELECT COUNT(*)
        FROM public.conversation_participants cp
        WHERE cp.conversation_id = c.id
        AND (cp.user_id = user_id_1 OR cp.user_id = user_id_2)
    ) = 2
    LIMIT 1;

    RETURN conversation_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
