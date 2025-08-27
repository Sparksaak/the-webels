
-- Function to get all conversations for a user, including participants and last message
create or replace function get_user_conversations_with_details(p_user_id uuid)
returns table (
    id uuid,
    name text,
    type text,
    created_at timestamptz,
    participants jsonb,
    last_message jsonb
)
language plpgsql
security definer -- This is crucial to bypass RLS policies that might cause recursion
set search_path = public
as $$
begin
    return query
    with user_convos as (
        -- Get all conversation IDs the user is a part of
        select conversation_id
        from conversation_participants
        where user_id = p_user_id
    ),
    convo_participants as (
        -- Get all participants for those conversations
        select
            cp.conversation_id,
            jsonb_agg(
                jsonb_build_object(
                    'id', u.id,
                    'name', u.raw_user_meta_data->>'full_name',
                    'email', u.email,
                    'role', u.raw_user_meta_data->>'role',
                    'avatarUrl', 'https://placehold.co/100x100.png'
                )
            ) as participants
        from conversation_participants cp
        join auth.users u on cp.user_id = u.id
        where cp.conversation_id in (select conversation_id from user_convos)
        group by cp.conversation_id
    ),
    last_messages as (
        -- Get the last message for each of those conversations
        select distinct on (conversation_id)
            conversation_id,
            jsonb_build_object(
                'content', content,
                'timestamp', created_at
            ) as message_data
        from messages
        where conversation_id in (select conversation_id from user_convos)
        order by conversation_id, created_at desc
    )
    -- Combine everything
    select
        c.id,
        c.name,
        c.type,
        c.created_at,
        cp.participants,
        lm.message_data
    from conversations c
    join user_convos uc on c.id = uc.conversation_id
    left join convo_participants cp on c.id = cp.conversation_id
    left join last_messages lm on c.id = lm.conversation_id;
end;
$$;


-- Function to check for an existing DM between two users to prevent duplicates
create or replace function get_existing_direct_conversation(user_id_1 uuid, user_id_2 uuid)
returns uuid
language sql
security definer
set search_path = public
as $$
    select c.id
    from conversations c
    where c.type = 'direct'
    and exists (
        select 1
        from conversation_participants cp1
        where cp1.conversation_id = c.id and cp1.user_id = user_id_1
    )
    and exists (
        select 1
        from conversation_participants cp2
        where cp2.conversation_id = c.id and cp2.user_id = user_id_2
    )
    limit 1;
$$;
