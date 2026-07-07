-- Guide.Ferryman v4.5 資料庫小補丁：補助快訊的申請時間／截止時間
-- （已跑過 v4 主檔者，只需執行本檔；可重複執行）
alter table public.premium_articles add column if not exists apply_start text not null default '';
alter table public.premium_articles add column if not exists apply_end   text not null default '';
