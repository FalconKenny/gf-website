-- ============================================================
-- Guide.Ferryman v5.0 資料庫補丁：
-- Line 收款流程配套（會員資料查詢）＋全站限時免費開放
-- （已跑過 v4 系列者執行本檔即可；可重複執行）
-- ============================================================

-- 1) 網站設定表（存放「全站限時開放」等開關）----------------
create table if not exists public.gf_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.gf_settings enable row level security;
drop policy if exists "admin all gf_settings" on public.gf_settings;
create policy "admin all gf_settings" on public.gf_settings
  for all to authenticated using (true) with check (true);
-- （匿名不可直接讀寫；前台一律走下方 RPC）

-- 2) RPC：全站限時開放查詢（回傳開放截止時間；未開放回 null）
create or replace function public.gf_open_until()
returns timestamptz language sql security definer set search_path = public as $$
  select case
    when (value->>'until')::timestamptz > now() then (value->>'until')::timestamptz
    else null end
  from gf_settings where key = 'open_access';
$$;

-- 3) 進階文章讀取：限時開放期間，不需通行碼即可讀全部單元
create or replace function public.gf_premium_list(p_code text, p_section text)
returns setof public.premium_articles
language sql security definer set search_path = public as $$
  select a.* from premium_articles a
  where a.section = p_section
    and ( a.access_level <= public.gf_check_pass(p_code)
          or public.gf_open_until() is not null )
  order by a.published desc, a.created_at desc;
$$;

-- 4) RPC：付費會員查詢自己的資料（通行碼換基本資料＋截止期限）
create or replace function public.gf_pass_info(p_code text)
returns table(email text, tier_level int, expires_at date, billing_cycle text, pay_method text, created_at timestamptz)
language sql security definer set search_path = public as $$
  select email, tier_level, expires_at, billing_cycle, pay_method, created_at
  from member_passes
  where code = trim(p_code) and active = true limit 1;
$$;

-- 5) RPC：一般會員以 Email 查詢自己的基本資料
create or replace function public.gf_member_info(p_email text)
returns table(name text, email text, tier text, tier_level int, subscribe boolean, joined text)
language sql security definer set search_path = public as $$
  select name, email, tier, tier_level, subscribe, joined
  from members where lower(email) = lower(trim(p_email)) limit 1;
$$;

grant execute on function public.gf_open_until() to anon, authenticated;
grant execute on function public.gf_premium_list(text, text) to anon, authenticated;
grant execute on function public.gf_pass_info(text) to anon, authenticated;
grant execute on function public.gf_member_info(text) to anon, authenticated;
