
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_type') THEN
        CREATE TYPE public.conversation_type AS ENUM ('direct', 'group');
    END IF;
END
$$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'conversations'
          AND column_name = 'type'
          AND udt_name <> 'conversation_type'
    ) THEN
        ALTER TABLE public.conversations ALTER COLUMN type TYPE public.conversation_type USING type::public.conversation_type;
    END IF;
END
$$;


CREATE OR REPLACE FUNCTION get_user_conversations_with_details(p_user_id UUID)
RETURNS TABLE(
    id UUID,
    name TEXT,
    type public.conversation_type,
    participants JSON,
    last_message JSON,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    WITH user_conversations AS (
        SELECT c.id, c.name, c.type, c.created_at
        FROM conversations c
        JOIN conversation_participants cp ON c.id = cp.conversation_id
        WHERE cp.user_id = p_user_id
    ),
    conversation_participants_agg AS (
        SELECT
            cp.conversation_id,
            json_agg(json_build_object(
                'id', u.id,
                'name', u.raw_user_meta_data->>'full_name',
                'email', u.email,
                'role', u.raw_user_meta_data->>'role',
                'avatarUrl', 'https://placehold.co/100x100.png'
            )) AS participants
        FROM conversation_participants cp
        JOIN auth.users u ON cp.user_id = u.id
        WHERE cp.conversation_id IN (SELECT uc.id FROM user_conversations uc)
        GROUP BY cp.conversation_id
    ),
    last_messages AS (
        SELECT
            m.conversation_id,
            json_build_object(
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
            WHERE m.conversation_id IN (SELECT uc.id FROM user_conversations uc)
        ) m
        WHERE m.rn = 1
    )
    SELECT
        uc.id,
        uc.name,
        uc.type,
        cpa.participants,
        lm.last_message,
        uc.created_at
    FROM user_conversations uc
    LEFT JOIN conversation_participants_agg cpa ON uc.id = cpa.conversation_id
    LEFT JOIN last_messages lm ON uc.id = lm.conversation_id
    ORDER BY lm.last_message->>'timestamp' DESC NULLS LAST, uc.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_existing_direct_conversation(user_id_1 UUID, user_id_2 UUID)
RETURNS UUID AS $$
DECLARE
    conversation_id UUID;
BEGIN
    SELECT c.id INTO conversation_id
    FROM conversations c
    WHERE c.type = 'direct'::public.conversation_type
      AND (
          SELECT COUNT(DISTINCT cp.user_id)
          FROM conversation_participants cp
          WHERE cp.conversation_id = c.id
            AND cp.user_id IN (user_id_1, user_id_2)
      ) = 2
      AND (
          SELECT COUNT(cp.user_id)
          FROM conversation_participants cp
          WHERE cp.conversation_id = c.id
      ) = 2
    LIMIT 1;

    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
