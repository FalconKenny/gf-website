-- ============================================================
-- Guide.Ferryman v4.6 — GA4 流量數據表
-- 於 Supabase Dashboard → SQL Editor 貼上執行一次即可
-- ============================================================

-- 每日流量數據（由 GitHub Actions ga_traffic.py 寫入）
create table if not exists public.site_traffic (
  date        date primary key,
  users       integer not null default 0,   -- 活躍使用者
  sessions    integer not null default 0,   -- 工作階段
  pageviews   integer not null default 0,   -- 頁面瀏覽
  top_pages   jsonb   not null default '[]'::jsonb,  -- [{path, views}]
  updated_at  timestamptz not null default now()
);

alter table public.site_traffic enable row level security;

-- 任何人可讀（儀表板前端以 publishable key 讀取；數據非敏感）
drop policy if exists "site_traffic_read" on public.site_traffic;
create policy "site_traffic_read"
  on public.site_traffic for select
  using (true);

-- 僅 service_role（GitHub Actions）可寫，故不建立 insert/update policy
-- service_role 本身繞過 RLS，無需額外設定

-- 驗證
select 'site_traffic ready' as status;
