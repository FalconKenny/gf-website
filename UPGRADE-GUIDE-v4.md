# Guide.Ferryman 網站 v4 升級指南 — 會員分級制度

版本：v4-membership（基準：https://falconkenny.github.io/gf-website/ 現行版）

---

## 一、這一版新增了什麼

| 項目 | 說明 |
|---|---|
| 四級會員制度 | L1 普通（免費）／L2 青銅（免費＋訂閱週報）／L3 白銀（US$100 / NT$3,200 月）／L4 黃金（US$180 / NT$6,000 月） |
| 青銅自動化 | 前台「加入會員」勾選訂閱電子報 → 自動列為青銅會員，即後台「訂閱中」＝週報發放對象 |
| 隱藏頁 ×2 | `trends.html` 產業趨勢分析（每週趨勢＝白銀+；政策趨勢＝黃金）、`resources.html` 政府補助資源（黃金），皆有 台灣/美國 × AI/機器人/半導體/無人機/其他 篩選 |
| 導覽列權限 | L1/L2 看不到這兩個選單項；輸入通行碼解鎖後才出現。所有頁面多了「⭐ 會員升級」鈕 |
| 方案廣告浮框 | 首頁每個瀏覽階段自動跳出一次；「會員升級」鈕隨時可叫出；含四級比較、升級表單、付款連結區、通行碼輸入 |
| 升級通知 | 有人送出升級申請 → 立即透過 Formspree 寄 Email 給你（沿用諮詢表單同一端點），並寫入後台「升級申請」清單 |
| 通行碼機制 | 付費內容存於 Supabase `premium_articles`，由 RLS 保護；前台需輸入有效通行碼（`member_passes`）經 RPC 驗證才讀得到 |
| 後台新頁 ×2 | `admin/upgrades.html` 升級申請審核＋通行碼核發＋客戶通知信範本；`admin/premium.html` 進階文章管理 |

## 二、部署步驟（一次做完約 10 分鐘）

1. **執行資料庫升級**：Supabase Dashboard → SQL Editor → 貼上 `supabase_upgrade_v4.sql` 全部內容 → Run。可重複執行，不會弄壞舊資料。
2. **推上 GitHub Pages**：把本包所有檔案覆蓋到 repo（新增檔：`trends.html`、`resources.html`、`assets/js/membership.js`、`admin/upgrades.html`、`admin/premium.html`；修改檔：`index.html`、其餘前台頁、`assets/js/main.js`、`assets/js/admin.js`、`assets/css/style.css`、`admin/members.html`）。
   ```bash
   git add -A && git commit -m "v4: 會員分級制度" && git push
   ```
3. **測試流程**：
   - 首頁等 2.6 秒 → 方案浮框自動跳出 ✅
   - 送出一筆白銀升級申請 → 你的 Gmail 收到 Formspree 通知 ✅
   - 後台登入 → 「⭐ 升級申請與通行碼」→ 點「收款確認・開通」→ 產生通行碼並帶出 mailto 通知信 ✅
   - 前台「輸入會員通行碼」→ 導覽列出現隱藏頁 ✅

## 三、金流串接（選定後 5 分鐘接上）

打開 `assets/js/membership.js` 最上方的 `GF_PAY`，把付款連結貼進去即可，浮框會自動顯示付款按鈕：

```js
const GF_PAY = {
  silver_twd: "https://……",   // 綠界/藍新 定期定額授權連結（NT$3,200/月）
  gold_twd:   "https://……",   // NT$6,000/月
  silver_usd: "https://……",   // Lemon Squeezy / Polar 訂閱 Checkout（US$100/月）
  gold_usd:   "https://……"    // US$180/月
};
```

連結尚未填入前，浮框會顯示「送出申請後以 Email 提供付款方式」，流程照常運作（人工提供轉帳/付款連結）。

## 四、營運 SOP（收款 → 開通）

1. 客戶在浮框送出升級申請 → 你收到 Email、後台出現「待付款」。
2. 客戶完成付款（線上連結或轉帳）。
3. 後台「⭐ 升級申請與通行碼」→ 收款確認・開通：系統自動 (a) 產生通行碼 (b) 同步會員分級 (c) 帶出 Gmail 通知信範本（含通行碼與解鎖教學）→ 按送出即完成「通知客戶已開通」。
4. 客戶停止訂閱時：同頁把通行碼「停用」即可（前台立即失效）。

## 五、安全性說明（重要）

- **真正的付費內容請放後台「進階內容管理」**（存進 `premium_articles` 資料表）。這部分由 Supabase RLS 保護，沒有有效通行碼，任何人（包含看網頁原始碼）都拿不到內文。
- `resources.html` 內建的兩張補助彙整表（工研院整理版）是寫死在網頁裡的「基底知識庫」，技術上懂看原始碼的人可以看到。若日後這部分要完全付費化，把內容改由後台上架、刪掉頁內靜態表即可。
- 通行碼為每人一組，可個別停用；建議通知信中提醒「勿轉發」。

## 六、之後可加的自動化（免費額度內可行）

- **金流 webhook 自動開通**：綠界/藍新/Lemon Squeezy 付款成功 → 呼叫 Supabase Edge Function（免費額度 50 萬次/月）→ 自動寫入 `member_passes` ＋ 用 Resend 免費額度寄通行碼信。到時候就不用手動按「開通」。
- **到期自動停權**：Edge Function 收到「扣款失敗/取消訂閱」webhook → 自動把通行碼 `active=false`。
- 這兩項等你選定金流商後，我再幫你寫。

---
Guide.Ferryman Strategic Advisory · v4.3-membership · 2026-07-07
