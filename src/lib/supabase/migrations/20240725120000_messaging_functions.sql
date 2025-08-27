-- Drop existing functions and types if they exist, to ensure a clean slate for recreation.
DROP FUNCTION IF EXISTS public.get_user_conversations_with_details(p_user_id uuid);
DROP FUNCTION IF EXISTS public.get_existing_direct_conversation(user_id_1 uuid, user_id_2 uuid);
DROP TYPE IF EXISTS public.conversation_type;

-- Create the custom ENUM type for conversation types.
CREATE TYPE public.conversation_type AS ENUM ('direct', 'group');

-- Alter the 'conversations' table to use the new 'conversation_type' for the 'type' column.
-- This is crucial to prevent type mismatch errors in functions.
ALTER TABLE public.conversations
ALTER COLUMN type TYPE public.conversation_type
USING type::conversation_type;


-- Creates a function to get all conversations for a user, including participants and the last message.
-- This function is defined with SECURITY DEFINER to bypass RLS policies that were causing infinite recursion.
CREATE OR REPLACE FUNCTION public.get_user_conversations_with_details(p_user_id uuid)
RETURNS TABLE(
    id uuid,
    name text,
    type conversation_type,
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
        SELECT c.id, c.name, c.type, c.created_at
        FROM conversations c
        JOIN conversation_participants cp ON c.id = cp.conversation_id
        WHERE cp.user_id = p_user_id
    ),
    convo_participants AS (
        SELECT
            uc.id AS conversation_id,
            jsonb_agg(
                jsonb_build_object(
                    'id', u.id,
                    'name', u.raw_user_meta_data->>'full_name',
                    'email', u.email,
                    'role', u.raw_user_meta_data->>'role',
                    'avatarUrl', 'https://placehold.co/100x100.png'
                )
            ) AS participants
        FROM user_convos uc
        JOIN conversation_participants cp ON uc.id = cp.conversation_id
        JOIN auth.users u ON cp.user_id = u.id
        GROUP BY uc.id
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
                m.conversation_id,
                m.content,
                m.created_at,
                ROW_NUMBER() OVER(PARTITION BY m.conversation_id ORDER BY m.created_at DESC) as rn
            FROM messages m
            WHERE m.conversation_id IN (SELECT id FROM user_convos)
        ) m
        WHERE m.rn = 1
    )
    SELECT
        uc.id,
        uc.name,
        uc.type,
        cp.participants,
        lm.last_message,
        uc.created_at
    FROM user_convos uc
    LEFT JOIN convo_participants cp ON uc.id = cp.conversation_id
    LEFT JOIN last_messages lm ON uc.id = lm.conversation_id
    ORDER BY lm.last_message->>'timestamp' DESC NULLS LAST, uc.created_at DESC;
END;
$$;


-- Creates a function to find an existing direct conversation between two users.
-- This helps prevent creating duplicate DM channels.
CREATE OR REPLACE FUNCTION public.get_existing_direct_conversation(user_id_1 uuid, user_id_2 uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    conversation_uuid uuid;
BEGIN
    SELECT cp1.conversation_id INTO conversation_uuid
    FROM conversation_participants cp1
    JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
    JOIN conversations c ON cp1.conversation_id = c.id
    WHERE c.type = 'direct'
      AND cp1.user_id = user_id_1
      AND cp2.user_id = user_id_2
    GROUP BY cp1.conversation_id
    HAVING COUNT(*) = 2;

    RETURN conversation_uuid;
END;
$$;
