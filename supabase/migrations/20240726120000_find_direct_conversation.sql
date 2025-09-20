
create or replace function find_direct_conversation(user_id1 uuid, user_id2 uuid)
returns uuid as $$
declare
    conversation_uuid uuid;
begin
    select cp1.conversation_id into conversation_uuid
    from conversation_participants as cp1
    join conversation_participants as cp2 on cp1.conversation_id = cp2.conversation_id
    join conversations as c on cp1.conversation_id = c.id
    where cp1.user_id = user_id1
      and cp2.user_id = user_id2
      and c.type = 'direct'
    limit 1;

    return conversation_uuid;
end;
$$ language plpgsql;
