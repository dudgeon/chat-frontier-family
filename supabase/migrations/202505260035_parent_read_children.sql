alter table profiles enable row level security;

create policy "Parents can read their children profiles"
on profiles
for select
to authenticated
using (
  user_role = 'child'
  and parent_id = auth.uid()
);
