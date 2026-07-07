-- ============================================================
-- Guide.Ferryman 網站 v4：會員分級制度 資料庫升級腳本
-- 執行方式：Supabase Dashboard → SQL Editor → 貼上全部 → Run
-- 可重複執行（idempotent），不會破壞既有資料。
-- ============================================================

-- 1) members 表：分級欄位標準化 ------------------------------
--    四級：普通會員(free) / 青銅會員(bronze) / 白銀會員(silver) / 黃金會員(gold)
alter table if exists public.members
  add column if not exists tier_level int not null default 1;

-- 舊資料轉換（原本的中文分級 → 新四級）
update public.members set tier = '普通會員', tier_level = 1 where tier in ('免費會員') or tier is null;
update public.members set tier = '白銀會員', tier_level = 3 where tier = '標準訂閱';
update public.members set tier = '黃金會員', tier_level = 4 where tier = '進階訂閱';
update public.members set tier_level = 2 where tier = '青銅會員';
update public.members set tier_level = 3 where tier = '白銀會員';
update public.members set tier_level = 4 where tier = '黃金會員';
-- 已勾選訂閱電子報的普通會員 → 自動升為青銅（週報發放對象）
update public.members set tier = '青銅會員', tier_level = 2
  where tier_level = 1 and subscribe = true;

-- 2) 會員通行碼（付費會員解鎖隱藏頁用）------------------------
create table if not exists public.member_passes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  tier_level int not null check (tier_level in (3,4)),
  code text not null unique,
  active boolean not null default true,
  note text default '',
  created_at timestamptz not null default now()
);
alter table public.member_passes enable row level security;
drop policy if exists "admin all member_passes" on public.member_passes;
create policy "admin all member_passes" on public.member_passes
  for all to authenticated using (true) with check (true);
-- （匿名訪客無任何政策 → 完全不可讀寫；驗證一律走下方 RPC）

-- 3) 進階內容文章（每週產業趨勢分析／政策趨勢分析／補助資源）--
create table if not exists public.premium_articles (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('weekly','policy','grant_tw','grant_us')),
  region text not null default '台灣' check (region in ('台灣','美國')),
  cat text not null default '其他' check (cat in ('AI','機器人','半導體','無人機','其他')),
  access_level int not null default 3 check (access_level in (3,4)),
  title text not null,
  summary text default '',
  body text default '',
  published date not null default current_date,
  created_at timestamptz not null default now()
);
alter table public.premium_articles enable row level security;
drop policy if exists "admin all premium_articles" on public.premium_articles;
create policy "admin all premium_articles" on public.premium_articles
  for all to authenticated using (true) with check (true);

-- 4) 升級申請（前台「會員升級」表單寫入；管理員後台審核）------
create table if not exists public.upgrade_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  tier_requested int not null check (tier_requested in (3,4)),
  currency text not null default 'TWD' check (currency in ('TWD','USD')),
  message text default '',
  status text not null default '待付款' check (status in ('待付款','已開通','已取消')),
  created_at timestamptz not null default now()
);
alter table public.upgrade_requests enable row level security;
drop policy if exists "anon insert upgrade_requests" on public.upgrade_requests;
create policy "anon insert upgrade_requests" on public.upgrade_requests
  for insert to anon with check (true);
drop policy if exists "admin all upgrade_requests" on public.upgrade_requests;
create policy "admin all upgrade_requests" on public.upgrade_requests
  for all to authenticated using (true) with check (true);

-- 5) RPC：通行碼驗證與進階文章讀取（SECURITY DEFINER，匿名可呼叫）
create or replace function public.gf_check_pass(p_code text)
returns int language sql security definer set search_path = public as $$
  select coalesce((select tier_level from member_passes
                   where code = trim(p_code) and active = true limit 1), 0);
$$;

create or replace function public.gf_premium_list(p_code text, p_section text)
returns setof public.premium_articles
language sql security definer set search_path = public as $$
  select a.* from premium_articles a
  where a.section = p_section
    and a.access_level <= public.gf_check_pass(p_code)
  order by a.published desc, a.created_at desc;
$$;

grant execute on function public.gf_check_pass(text) to anon, authenticated;
grant execute on function public.gf_premium_list(text, text) to anon, authenticated;

-- 6) 範例內容（首次執行時塞入示範文章，之後可於後台刪改）------
insert into public.premium_articles (section, region, cat, access_level, title, summary, body, published)
select 'weekly','美國','機器人',3,
  '【每週趨勢】美國人形機器人供應鏈：關節模組國產化壓力升溫',
  '本週觀察：美系人形機器人整機廠加速尋找非中系減速器與致動器供應商，台灣諧波減速器與空心杯馬達廠商詢單能見度提升。',
  '（示範內容）本文為白銀級以上會員限定之每週產業趨勢分析範例。正式內容請於後台「進階內容管理」新增。',
  current_date
where not exists (select 1 from premium_articles);

insert into public.premium_articles (section, region, cat, access_level, title, summary, body, published)
select 'policy','美國','機器人',4,
  '【政策趨勢】American Security Robotics Act 審議進度與台廠合規清單',
  '黃金級限定：聯邦採購禁令的合規邊界、12 個月緩衝期的實務意涵、外包契約條款對系統整合商的影響。',
  '（示範內容）本文為黃金級會員限定之政策趨勢分析範例。正式內容請於後台「進階內容管理」新增。',
  current_date
where not exists (select 1 from premium_articles where section = 'policy');

-- 7) v4.3：全等級登入機制 ------------------------------------
--    Email 登入（青銅）：存在且已訂閱 → 回傳 2；存在未訂閱 → 1；查無 → 0
--    ※ 白銀/黃金仍須通行碼登入，Email 登入最高只給青銅，確保付費內容安全。
create or replace function public.gf_login_email(p_email text)
returns int language sql security definer set search_path = public as $$
  select coalesce((
    select case when subscribe = true or tier_level >= 2 then 2 else 1 end
    from members where lower(email) = lower(trim(p_email)) limit 1), 0);
$$;

-- 一鍵補訂閱：既有會員 Email → subscribe=true、升為青銅，回傳 2
create or replace function public.gf_opt_in(p_email text)
returns int language plpgsql security definer set search_path = public as $$
begin
  update members set subscribe = true,
    tier = case when tier_level < 2 then '青銅會員' else tier end,
    tier_level = greatest(tier_level, 2)
  where lower(email) = lower(trim(p_email));
  if found then return 2; else return 0; end if;
end;
$$;

grant execute on function public.gf_login_email(text) to anon, authenticated;
grant execute on function public.gf_opt_in(text) to anon, authenticated;
