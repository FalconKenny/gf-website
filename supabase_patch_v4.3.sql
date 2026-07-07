-- Guide.Ferryman v4.3 資料庫小補丁：全等級登入機制
-- 若已執行過 supabase_upgrade_v4.sql（v4.3 之前的版本），只需執行本檔。
-- 若從未執行過，請直接執行完整的 supabase_upgrade_v4.sql（已包含本補丁）。
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
