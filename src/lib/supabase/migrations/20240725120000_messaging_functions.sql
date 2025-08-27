
-- Function to get conversations for a user with participant details and last message
create or replace function get_user_conversations_with_details(p_user_id uuid)
returns table (
    id uuid,
    name text,
    type public.conversation_type,
    participants json,
    last_message json,
    created_at timestamptz
)
language plpgsql
security definer
as $$
begin
    return query
    with user_convos as (
        select conversation_id from conversation_participants where user_id = p_user_id
    ),
    convo_participants as (
        select
            cp.conversation_id,
            json_agg(json_build_object(
                'id', u.id,
                'name', u.raw_user_meta_data->>'full_name',
                'email', u.email,
                'role', u.raw_user_meta_data->>'role',
                'avatarUrl', 'https://placehold.co/100x100.png'
            )) as participants
        from conversation_participants cp
        join auth.users u on cp.user_id = u.id
        where cp.conversation_id in (select conversation_id from user_convos)
        group by cp.conversation_id
    ),
    latest_message as (
        select
            conversation_id,
            json_build_object(
                'content', content,
                'timestamp', created_at
            ) as last_message
        from (
            select
                conversation_id,
                content,
                created_at,
                row_number() over(partition by conversation_id order by m.created_at desc) as rn
            from messages m
            where conversation_id in (select conversation_id from user_convos)
        ) lm
        where rn = 1
    )
    select
        c.id,
        c.name,
        c.type,
        cp.participants,
        lm.last_message,
        c.created_at
    from conversations c
    join convo_participants cp on c.id = cp.conversation_id
    left join latest_message lm on c.id = lm.conversation_id
    where c.id in (select conversation_id from user_convos)
    order by (lm.last_message->>'timestamp')::timestamptz desc;
end;
$$;

-- Function to check for existing direct conversations to prevent duplicates
create or replace function get_existing_direct_conversation(user_id_1 uuid, user_id_2 uuid)
returns uuid
language plpgsql
security definer
as $$
declare
    existing_conversation_id uuid;
begin
    select c.id into existing_conversation_id
    from conversations c
    where c.type = 'direct'
    and (
        select count(cp.user_id)
        from conversation_participants cp
        where cp.conversation_id = c.id
        and cp.user_id in (user_id_1, user_id_2)
    ) = 2
    and (
        select count(cp.user_id)
        from conversation_participants cp
        where cp.conversation_id = c.id
    ) = 2
    limit 1;

    return existing_conversation_id;
end;
$$;
