/* Guide.Ferryman — Google Analytics 4 追蹤碼
   ============================================
   設定方式：
   1. 到 https://analytics.google.com 建立 GA4 資源（Property）
   2. 管理 → 資料串流 → 網站 → 輸入 https://falconkenny.github.io/gf-website/
   3. 取得「評估 ID」（格式 G-XXXXXXXXXX），貼到下方 GF_GA_ID
   4. 儲存並上傳本檔即可，前台 8 個頁面已載入本腳本

   注意：GF_GA_ID 留空或維持預設值時，不會載入任何追蹤碼（開發期安全）。 */

var GF_GA_ID = "G-5ESC4VF8V7";   /* ← 換成你的 GA4 評估 ID */

(function () {
  if (!GF_GA_ID || GF_GA_ID === "G-XXXXXXXXXX") return;   // 未設定則不追蹤

  // 動態載入 gtag.js
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + GF_GA_ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GF_GA_ID, {
    anonymize_ip: true,            // IP 匿名化
    page_path: location.pathname + location.search
  });
})();
