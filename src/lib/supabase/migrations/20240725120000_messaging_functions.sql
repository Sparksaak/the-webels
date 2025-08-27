-- Drop the existing ENUM type if it exists, along with dependent objects
DROP TYPE IF EXISTS public.conversation_type CASCADE;

-- Re-create the ENUM type
CREATE TYPE public.conversation_type AS ENUM ('direct', 'group');

-- Drop the function if it exists to ensure a clean recreation
DROP FUNCTION IF EXISTS get_user_conversations_with_details(uuid);
DROP FUNCTION IF EXISTS get_existing_direct_conversation(uuid, uuid);


CREATE OR REPLACE FUNCTION get_user_conversations_with_details(p_user_id uuid)
RETURNS TABLE (
    id uuid,
    name text,
    type public.conversation_type,
    participants json,
    last_message json,
    created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    WITH user_conversations AS (
        SELECT cp.conversation_id
        FROM public.conversation_participants cp
        WHERE cp.user_id = p_user_id
    )
    SELECT
        c.id,
        c.name,
        c.type,
        (
            SELECT json_agg(json_build_object(
                'id', u.id,
                'name', u.raw_user_meta_data->>'full_name',
                'email', u.email,
                'role', u.raw_user_meta_data->>'role',
                'avatarUrl', 'https://placehold.co/100x100.png'
            ))
            FROM public.conversation_participants cp_inner
            JOIN auth.users u ON cp_inner.user_id = u.id
            WHERE cp_inner.conversation_id = c.id
        ) as participants,
        (
            SELECT json_build_object(
                'content', m.content,
                'timestamp', m.created_at
            )
            FROM public.messages m
            WHERE m.conversation_id = c.id
            ORDER BY m.created_at DESC
            LIMIT 1
        ) as last_message,
        c.created_at
    FROM public.conversations c
    WHERE c.id IN (SELECT conversation_id FROM user_conversations);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION get_existing_direct_conversation(user_id_1 uuid, user_id_2 uuid)
RETURNS uuid AS $$
DECLARE
    conversation_uuid uuid;
BEGIN
    SELECT c.id INTO conversation_uuid
    FROM conversations c
    WHERE c.type = 'direct'
      AND (
          SELECT COUNT(DISTINCT cp.user_id)
          FROM conversation_participants cp
          WHERE cp.conversation_id = c.id
            AND cp.user_id IN (user_id_1, user_id_2)
      ) = 2
      AND (
          SELECT COUNT(*)
          FROM conversation_participants cp
          WHERE cp.conversation_id = c.id
      ) = 2
    LIMIT 1;

    RETURN conversation_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;