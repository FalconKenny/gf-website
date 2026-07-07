# GA4 串接設定指南（v4.6）

儀表板流量從「示範數據」升級為「GA4 真實數據」。
架構：前台 gtag 追蹤 → GA4 收集 → GitHub Actions 每日抓取 → 寫入 Supabase `site_traffic` → 後台儀表板讀取。全程免費方案。

---

## 本次更新檔案清單

| 檔案 | 動作 | 說明 |
|---|---|---|
| `assets/js/ga.js` | 新增 | GA4 追蹤碼載入器（需填入評估 ID） |
| `index.html` 等 8 個前台頁面 | 修改 | `</head>` 前加入一行 `<script src="assets/js/ga.js"></script>` |
| `admin/index.html` | 修改 | 儀表板讀取 `site_traffic` 真實數據 + 熱門頁面表 |
| `scripts/ga_traffic.py` | 新增 | GA4 Data API → Supabase 同步腳本 |
| `.github/workflows/ga-traffic.yml` | 新增 | 每日台北 07:30 自動同步 |
| `supabase_patch_v4.6_ga.sql` | 新增 | 建立 `site_traffic` 表 + RLS |

上傳方式：GitHub 網頁 →「Add file → Upload files」，依原目錄結構放置（`assets/js/`、`scripts/`、`.github/workflows/`、`admin/`、根目錄）。

---

## 步驟一：建立 GA4 資源，取得評估 ID（約 5 分鐘）

1. 到 https://analytics.google.com → 管理（左下齒輪）→「建立 → 資源」
2. 資源名稱：`Guide.Ferryman Website`，時區選台灣、幣別 TWD
3. 建立「資料串流 → 網站」，網址填 `https://falconkenny.github.io`，串流名稱 `gf-website`
4. 取得 **評估 ID**（格式 `G-XXXXXXXXXX`）
5. 開啟 `assets/js/ga.js`，把第 11 行 `G-XXXXXXXXXX` 換成你的評估 ID，上傳

> 未填評估 ID 時，ga.js 不會載入任何追蹤碼，可安心先上傳其他檔案。

驗證：上傳後開啟官網任一頁 → GA4「報表 → 即時」應在 1 分鐘內看到自己。

---

## 步驟二：建立 Supabase 資料表（約 1 分鐘）

Supabase Dashboard → SQL Editor → 貼上 `supabase_patch_v4.6_ga.sql` 全部內容 → Run。
看到 `site_traffic ready` 即完成。

---

## 步驟三：建立 Google 服務帳戶（約 10 分鐘，只做一次）

GitHub Actions 需要一組「機器人帳號」讀取 GA4 數據：

1. 到 https://console.cloud.google.com →（沿用你申請 Gemini 金鑰的專案即可）
2. 「API 和服務 → 程式庫」→ 搜尋 **Google Analytics Data API** → 啟用
3. 「IAM 與管理 → 服務帳戶」→ 建立服務帳戶
   - 名稱：`gf-ga-reader`（角色可略過，不需任何 GCP 角色）
4. 進入該服務帳戶 →「金鑰 → 新增金鑰 → JSON」→ 下載 JSON 檔
5. 複製服務帳戶的 email（形如 `gf-ga-reader@xxx.iam.gserviceaccount.com`）
6. 回到 GA4 → 管理 →「資源存取權管理」→ 加入成員 → 貼上該 email → 角色選 **檢視者** → 邀請

## 步驟四：設定 GitHub Secrets（約 3 分鐘）

GitHub repo → Settings → Secrets and variables → Actions → New repository secret：

| Secret 名稱 | 內容 |
|---|---|
| `GA_PROPERTY_ID` | GA4「資源 ID」（純數字；GA4 管理 → 資源詳細資料 可查） |
| `GA_SERVICE_ACCOUNT_JSON` | 步驟三下載的 JSON 檔**完整內容**（整份貼上） |
| `SUPABASE_URL` | 已存在，沿用 |
| `SUPABASE_SERVICE_KEY` | 已存在，沿用 |

> 注意：`GA_PROPERTY_ID` 是資源 ID（數字），不是評估 ID（G- 開頭）。

---

## 步驟五：首次執行與驗證

1. GitHub → Actions → **GF-GA-Traffic** → Run workflow（手動觸發）
2. 執行成功後，Supabase → Table Editor → `site_traffic` 應出現最近 14 天資料
   （網站剛裝追蹤碼時 GA 尚無歷史數據，數字為 0 屬正常，隔日起累積）
3. 開啟後台儀表板 `admin/index.html`：
   - 流量圖標題變為「本週流量（GA4 頁面瀏覽）」
   - 新增「近 7 日活躍使用者 / 頁面瀏覽」兩張統計卡
   - 新增「近 7 日熱門頁面」表格

之後每天台北時間 07:30 自動同步，無需手動維護。

---

## 常見問題

- **workflow 報 403 PERMISSION_DENIED**：服務帳戶 email 尚未加入 GA4 資源存取權（步驟三第 6 點），或 Analytics Data API 未啟用。
- **儀表板仍顯示「示範數據」**：`site_traffic` 表尚無資料——確認步驟二 SQL 已執行、workflow 已成功跑過一次。
- **GA 即時報表看不到自己**：確認 ga.js 已填入正確評估 ID 並已上傳；瀏覽器擋廣告外掛可能封鎖 gtag，可用無痕視窗測試。
- **隱私**：ga.js 已開啟 `anonymize_ip`（IP 匿名化）。
