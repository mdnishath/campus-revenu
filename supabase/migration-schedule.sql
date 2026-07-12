-- Review text + calendar scheduling for tasks
alter table public.tasks add column if not exists review_text text;
alter table public.tasks add column if not exists starts_at timestamptz;
alter table public.tasks add column if not exists ends_at timestamptz;
