# Guide.Ferryman 官網 SEO 優化部署指南（v1.0，2026-07-08）

基準版：https://falconkenny.github.io/gf-website/（本次修改皆以線上版 clone 為基礎）

---

## 一、本次修改內容總覽

### 修改的既有檔案（直接覆蓋）
| 檔案 | 修改內容 |
|---|---|
| `index.html` | 新增 canonical、Open Graph／Twitter 分享標籤、JSON-LD 結構化資料（ProfessionalService + WebSite） |
| `about.html` | 新增 meta description、canonical、OG／Twitter 標籤 |
| `services.html` | 新增 meta description、canonical、OG／Twitter 標籤；標題改為「服務項目｜赴美佈局・政府補助陪跑・產業趨勢分析｜Guide.Ferryman」（含關鍵字） |
| `insights.html` | 新增 meta description、canonical、OG／Twitter 標籤；標題改為「台美動態資訊｜AI・機器人・半導體・無人機產業新聞｜Guide.Ferryman」 |
| `contact.html` | 新增 meta description、canonical、OG／Twitter 標籤 |
| `invest-map.html` | 新增 canonical、OG／Twitter 標籤（原有 description 保留） |
| `admin/` 全部 7 頁 | 加入 `<meta name="robots" content="noindex,nofollow">`，防止後台頁被 Google 收錄 |
| `scripts/daily_news.py` | 每日圖卡頁自動加入 SEO 標籤（description、canonical、OG）；每日自動將新圖卡頁加入 `sitemap.xml`（try/except 保護，失敗不影響主流程） |

### 新增檔案
| 檔案 | 用途 |
|---|---|
| `sitemap.xml` | 六個公開頁面的網站地圖；每日 pipeline 會自動追加當日圖卡頁 |
| `robots.txt` | 爬蟲規則（有限制，見第三節說明） |
| `assets/img/og-image.png` | 1200×630 品牌分享圖（墨海藍底＋航線座標），LINE／Facebook／LinkedIn 分享時顯示 |

### 刻意不動的部分
- `trends.html`、`resources.html`：原本就有 `noindex`（會員專區，正確），維持不變
- 所有頁面內容、樣式、Supabase 串接：零改動

---

## 二、部署步驟（GitHub 網頁上傳）

1. 進入 repo `FalconKenny/gf-website`
2. 根目錄：Upload files 上傳 `index.html`、`about.html`、`services.html`、`insights.html`、`contact.html`、`invest-map.html`、`sitemap.xml`、`robots.txt`（覆蓋既有檔案）
3. 進入 `admin/` 資料夾：上傳 7 個 admin html 檔覆蓋
4. 進入 `scripts/`：上傳 `daily_news.py` 覆蓋
5. 進入 `assets/img/`：上傳 `og-image.png`
6. Commit 後等 1–2 分鐘 GitHub Pages 重建

---

## 三、部署後必做：Google Search Console（免費，最重要的一步）

網站目前最大的 SEO 瓶頸不是標籤，而是 **Google 還不知道要來抓**。GitHub Pages 專案網站沒有反向連結時，收錄非常慢，必須主動提交。

1. 前往 https://search.google.com/search-console
2. 新增資源 → 選「網址前置字元」→ 輸入 `https://falconkenny.github.io/gf-website/`
3. 驗證方式選「HTML 標記」，會給你一行 `<meta name="google-site-verification" content="...">` — **把這行貼給我，我幫你加進 index.html**（或你自行加在 `<head>` 內 title 下方）
4. 驗證通過後 → 左側「Sitemap」→ 提交 `sitemap.xml`
5. 「網址檢查」輸入首頁網址 → 點「要求建立索引」，六個公開頁面各做一次

同場加映：Bing Webmaster Tools（https://www.bing.com/webmasters）可直接用 Google Search Console 帳號匯入，一鍵完成。

## 四、robots.txt 的限制（重要）

GitHub Pages「專案網站」的 robots.txt 放在 `/gf-website/robots.txt` **不會被爬蟲讀取**——爬蟲只讀網域根目錄 `https://falconkenny.github.io/robots.txt`。

- 後台防收錄：已改用每頁 `noindex` meta 標籤處理，**不依賴 robots.txt，已經安全**
- repo 內的 robots.txt 僅供未來綁自訂網域（custom domain）時直接生效
- 若想讓根目錄 robots.txt 生效：需另建一個名為 `falconkenny.github.io` 的 repo（使用者網站），把 robots.txt 放進去。非必要，暫可略過

## 五、驗收方式

部署完成後：
1. **分享圖**：用 https://www.opengraph.xyz 或 LINE 貼上網址，應顯示墨海藍品牌卡片
2. **結構化資料**：https://search.google.com/test/rich-results 輸入首頁網址，應偵測到 ProfessionalService
3. **sitemap**：瀏覽器開 `https://falconkenny.github.io/gf-website/sitemap.xml` 應正常顯示
4. **明日 pipeline**：GitHub Actions 跑完後，檢查 sitemap.xml 是否自動多了一筆當日 `daily-briefs/.../knowledge-cards.html`
5. 收錄進度：GSC 提交後約 3–14 天，可在 Google 搜尋 `site:falconkenny.github.io/gf-website` 觀察

## 六、後續可再強化（本次未做）

- **自訂網域**（如 guideferryman.com）：對 SEO 幫助最大的單一動作——品牌網域權重、根目錄 robots.txt 生效、Email 信任度提升；年費約 USD 10–15
- 每篇 weekly 分析文章若日後輸出成獨立 HTML 頁，可套用 `Article` JSON-LD ＋加入 sitemap（daily_news.py 的模式可直接複用）
- invest-map 各州資訊若拆成獨立 URL（例如 `#state=TX` 改為獨立頁），50 州可各自被收錄，長尾流量潛力大
