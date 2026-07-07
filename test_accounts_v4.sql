-- ============================================================
-- Guide.Ferryman 四級會員測試帳號（Supabase SQL Editor 執行）
-- 可重複執行；測試完可用最下方的清除段落刪掉。
-- ============================================================

-- L1 普通會員：已加入但未訂閱（Email 登入會出現「一鍵訂閱」提示）
insert into public.members (id, name, email, company, interest, subscribe, tier, tier_level, joined)
select 'test-l1', '測試普通', 'test-l1@gf.test', '測試公司', 'AI', false, '普通會員', 1, current_date::text
where not exists (select 1 from public.members where email = 'test-l1@gf.test');

-- L2 青銅會員：已加入＋訂閱（用 Email 登入）
insert into public.members (id, name, email, company, interest, subscribe, tier, tier_level, joined)
select 'test-l2', '測試青銅', 'test-l2@gf.test', '測試公司', '機器人', true, '青銅會員', 2, current_date::text
where not exists (select 1 from public.members where email = 'test-l2@gf.test');

-- L3 白銀會員：會員資料＋通行碼 GF-TESTL3
insert into public.members (id, name, email, company, interest, subscribe, tier, tier_level, joined)
select 'test-l3', '測試白銀', 'test-l3@gf.test', '測試公司', '半導體', true, '白銀會員', 3, current_date::text
where not exists (select 1 from public.members where email = 'test-l3@gf.test');
insert into public.member_passes (email, tier_level, code, note)
select 'test-l3@gf.test', 3, 'GF-TESTL3', '測試帳號'
where not exists (select 1 from public.member_passes where code = 'GF-TESTL3');

-- L4 黃金會員：會員資料＋通行碼 GF-TESTL4
insert into public.members (id, name, email, company, interest, subscribe, tier, tier_level, joined)
select 'test-l4', '測試黃金', 'test-l4@gf.test', '測試公司', '無人機', true, '黃金會員', 4, current_date::text
where not exists (select 1 from public.members where email = 'test-l4@gf.test');
insert into public.member_passes (email, tier_level, code, note)
select 'test-l4@gf.test', 4, 'GF-TESTL4', '測試帳號'
where not exists (select 1 from public.member_passes where code = 'GF-TESTL4');

-- ─── 測試完畢後，執行以下兩行即可清除全部測試資料 ───
-- delete from public.member_passes where note = '測試帳號';
-- delete from public.members where email like 'test-l%@gf.test';
