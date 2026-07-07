-- ============================================================
-- Guide.Ferryman v4.8 資料庫補丁：會員計費期限系統
-- （已跑過 v4 主檔者執行本檔即可；可重複執行）
-- ============================================================

-- 1) 通行碼 加上：到期日、繳費週期、繳費方式、自動續費
alter table public.member_passes add column if not exists expires_at date;
alter table public.member_passes add column if not exists billing_cycle text not null default '月費'
  ; -- 值：月費 / 年費
alter table public.member_passes add column if not exists pay_method text not null default '待確認'
  ; -- 值：信用卡定期定額 / 銀行轉帳 / 線上訂閱(USD) / 待確認
alter table public.member_passes add column if not exists auto_renew boolean not null default false;

-- 既有通行碼若無到期日 → 預設從核發日起算 1 個月
update public.member_passes
  set expires_at = (created_at::date + interval '1 month')::date
  where expires_at is null and note <> '測試帳號';

-- 2) 升級申請 加上：繳費週期（月費／年費半價）
alter table public.upgrade_requests add column if not exists billing_cycle text not null default '月費';

-- 3) 通行碼驗證改為「有效且未到期」才放行
create or replace function public.gf_check_pass(p_code text)
returns int language sql security definer set search_path = public as $$
  select coalesce((select tier_level from member_passes
                   where code = trim(p_code)
                     and active = true
                     and (expires_at is null or expires_at >= current_date)
                   limit 1), 0);
$$;
grant execute on function public.gf_check_pass(text) to anon, authenticated;
