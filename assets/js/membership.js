/* ============================================================
   Guide.Ferryman — 會員分級制度（v4）
   四級制：
   L1 普通會員（免費）　　→ 瀏覽公開內容（動態資訊、熱門動態）
   L2 青銅會員（免費）　　→ 加入會員＋訂閱電子報者，收每週週報
   L3 白銀會員（US$100/月；NT$3,200/月）→ 解鎖「每週產業趨勢分析」
   L4 黃金會員（US$180/月；NT$6,000/月）→ 加開「政策趨勢分析」＋「台灣/美國政府補助資源」

   金流串接：於下方 GF_PAY 填入付款連結即自動顯示於升級視窗。
   尚未填入連結時，流程為：送出升級申請 → Email 通知管理者
   → 管理者提供付款方式 → 收款後於後台開通並寄送「會員通行碼」。
   ============================================================ */

/* ---------- ① 金流連結設定（申請完成後填入即可） ---------- */
const GF_PAY = {
  /* 台幣（台灣客戶）：藍新 NewebPay 後台建立的
     「信用卡定期定額 委託連結」貼於此（見 NEWEBPAY-GUIDE.md）。 */
  silver_twd: "",        gold_twd: "",          /* 月繳 */
  silver_twd_year: "",   gold_twd_year: "",     /* 年繳（半價） */
  /* 美元（國際客戶）：Lemon Squeezy / Polar / Gumroad 的
     訂閱商品 Checkout 連結貼於此。 */
  silver_usd: "",        gold_usd: "",          /* 月繳 */
  silver_usd_year: "",   gold_usd_year: ""      /* 年繳（半價） */
};

/* LINE 官方帳號（升級付款流程用） */
const GF_LINE = { id: "@396whyo", url: "https://lin.ee/ZGQkHj7" };

const GF_TIERS = [
  { lv:1, key:"free",   name:"普通會員", price:"免費", color:"#5B6B7C",
    perks:["瀏覽台美動態資訊與每日熱門動態","使用美洲產業地圖","預約諮詢"] },
  { lv:2, key:"bronze", name:"青銅會員", price:"免費（加入會員＋訂閱）", color:"#B07A3F",
    perks:["包含普通會員全部權益","每週一收到《台美產業動態週報》","優先取得活動與研究發布通知"] },
  { lv:3, key:"silver", name:"白銀會員", price:"US$100 / 月（NT$3,200）\n年繳半價：US$600（NT$19,200）/ 年", color:"#8FA6B8",
    perks:["包含青銅會員全部權益","解鎖【每週產業趨勢分析】隱藏頁","台灣×美國 · AI／機器人／半導體／無人機 分類深度短評"] },
  { lv:4, key:"gold",   name:"黃金會員", price:"US$180 / 月（NT$6,000）\n年繳半價：US$1,080（NT$36,000）/ 年", color:"#E8A23D",
    perks:["包含白銀會員全部權益","解鎖【政策趨勢分析】","解鎖【台灣政府補助資源】＋【美國政府補助資源】","補助申請重點時程提醒"] }
];

/* ---------- ② 目前解鎖狀態（通行碼驗證後存於本瀏覽器） ---------- */
function gfTier() { try { return parseInt(sessionStorage.getItem("gf_tier") || "0", 10) || 0; } catch (e) { return 0; } }
/* 等級符號徽章：⚪普通 🥉青銅 🥈白銀 🥇黃金 */
const GF_TIER_ICON = { 1: "⚪", 2: "🥉", 3: "🥈", 4: "🥇" };
function gfTierBadge(lv) {
  const t = GF_TIERS.find(x => x.lv === lv);
  return t ? (GF_TIER_ICON[lv] + " " + t.name) : "";
}
/* L1/L2 沒有登入機制：加入會員當下記錄於本瀏覽器（localStorage） */
function gfLocalTier() { try { return parseInt(localStorage.getItem("gf_local_tier") || "0", 10) || 0; } catch (e) { return 0; } }
function gfSetLocalTier(lv) { try { localStorage.setItem("gf_local_tier", String(lv)); } catch (e) {} }
/* 顯示用等級 = 通行碼等級 與 本機記錄 取較高者 */
function gfShownTier() { return Math.max(gfTier(), gfLocalTier()); }
function gfPass() { try { return sessionStorage.getItem("gf_pass") || ""; } catch (e) { return ""; } }
function gfSetTier(lv, code) {
  sessionStorage.setItem("gf_tier", String(lv));
  sessionStorage.setItem("gf_pass", code || "");
}
function gfMemberLogout() {
  sessionStorage.removeItem("gf_tier"); sessionStorage.removeItem("gf_pass");
  sessionStorage.removeItem("gf_email");
  location.reload();
}

/* ---------- ③ 通行碼驗證（呼叫 Supabase RPC） ---------- */
async function gfVerifyPass(code) {
  if (!code) return 0;
  try {
    const lv = await gfSb("/rest/v1/rpc/gf_check_pass", { method: "POST", body: { p_code: code } });
    return parseInt(lv, 10) || 0;
  } catch (e) { console.warn("通行碼驗證失敗：", e.message); return 0; }
}
async function gfPremiumList(section) {
  return gfSb("/rest/v1/rpc/gf_premium_list", { method: "POST", body: { p_code: gfPass(), p_section: section } });
}

/* ---------- ④ 升級／方案 浮框（廣告視窗） ---------- */
function gfEnsureUpgradeModal() {
  if (document.getElementById("upgradeModal")) return;
  const payRow = (twd, usd) => {
    let h = "";
    if (twd) h += `<a class="btn btn-teal btn-pay" href="${twd}" target="_blank" rel="noopener">台幣付款：藍新信用卡定期定額</a>`;
    if (usd) h += `<a class="btn btn-ghost btn-pay" href="${usd}" target="_blank" rel="noopener">Pay in USD（International）</a>`;
    return h;
  };
  document.body.insertAdjacentHTML("beforeend", `
  <div class="modal-bg" id="upgradeModal" onclick="if(event.target===this)gfCloseModal('upgradeModal')">
    <div class="modal modal-wide" role="dialog" aria-label="會員方案">
      <button class="close" onclick="gfCloseModal('upgradeModal')">✕</button>
      <p class="kicker" style="margin-bottom:6px">MEMBERSHIP · 會員分級方案</p>
      <h3 style="margin-bottom:4px">解鎖 Guide.Ferryman 深度研究</h3>
      <p style="font-size:14px;color:var(--slate);margin-bottom:18px">每週產業趨勢、政策解讀與台美補助資源，為決策者準備的付費情報。
        ${gfTier() >= 2 ? `<span class="cur-tier">您目前的等級：${gfTierBadge(gfTier())}</span>` : ""}</p>

      <div class="tier-grid">
        ${GF_TIERS.map(t => `
        <div class="tier-card ${t.lv===4?"tier-hot":""}" style="--tc:${t.color}">
          ${t.lv===4?'<span class="tier-flag">最完整</span>':""}
          <p class="tier-name">${t.name}</p>
          <p class="tier-price">${t.price.split("\n").join("<br>")}</p>
          <ul>${t.perks.map(p=>`<li>${p}</li>`).join("")}</ul>
          ${t.lv<=2
            ? `<button class="btn btn-ghost" style="width:100%" onclick="gfCloseModal('upgradeModal');gfOpenMember()">${t.lv===1?"免費加入":"加入並訂閱週報"}</button>`
            : `<button class="btn ${t.lv===4?"btn-amber":"btn-teal"}" style="width:100%" onclick="gfPickTier(${t.lv})">升級為${t.name}</button>`}
        </div>`).join("")}
      </div>

      <!-- 升級表單（選了白銀/黃金後顯示） -->
      <div id="upgForm" style="display:none;margin-top:22px;border-top:1px dashed rgba(10,28,48,.2);padding-top:18px">
        <h4 style="font-family:var(--font-display);margin-bottom:4px">升級為 <span id="upgTierName"></span></h4>
        <p style="font-size:13.5px;color:var(--slate);margin-bottom:12px">送出後我們會立即收到通知；完成付款並經確認後，將以 Email 寄送您的「會員通行碼」以解鎖隱藏頁。<br>
<b>續約說明</b>：訂閱將依您選擇的週期（月／年）於到期日自動續費扣款；您可隨時來信取消，取消後權限保留至當期結束。</p>
        <form onsubmit="return gfUpgradeSubmit(event)">
          <div class="grid-2">
            <div class="field"><label>姓名 *</label><input class="inp" name="name" required></div>
            <div class="field"><label>Email *</label><input class="inp" type="email" name="email" required></div>
            <div class="field"><label>付款幣別</label>
              <select class="sel" name="currency"><option value="TWD">台幣 TWD</option><option value="USD">美元 USD</option></select></div>
            <div class="field"><label>繳費週期</label>
              <select class="sel" name="billing_cycle" onchange="gfCycleChange(this.value)"><option value="月費">月費（每月自動扣款）</option><option value="年費">年費（享 12 個月半價優惠）</option></select></div>
            <div class="field"><label>備註（選填）</label><input class="inp" name="message" placeholder="想了解的產業、發票需求…"></div>
          </div>
          <div id="upgPayLinks" style="margin:10px 0"></div>
          <button class="btn btn-amber" type="submit" style="width:100%">送出升級申請</button>
          <div class="ok-box" id="upgOk">✅ 已收到您的升級申請！請立即加入 LINE 官方帳號（<b>@396whyo</b>）由服務人員為您完成付款與開通：<br><a class="btn btn-line" style="margin-top:8px" href="https://lin.ee/ZGQkHj7" target="_blank" rel="noopener">➕ 加入 LINE 官方帳號</a></div>
        </form>
      </div>

      <!-- 會員登入：Email（青銅）或通行碼（白銀/黃金） -->
      <div style="margin-top:18px;text-align:center;font-size:13.5px;color:var(--slate)">
        已是會員？
        <a href="#" onclick="gfOpenPassEntry(event)">🔑 會員登入 →</a>
      </div>
      <div id="passEntry" style="display:none;margin-top:12px">
        <p style="text-align:center;font-size:13px;color:var(--slate);margin-bottom:10px">
          🥉 青銅會員：輸入加入會員時填寫的 <b>Email</b> 登入。<br>
          🥈 白銀／🥇 黃金會員：輸入開通信中的<b>通行碼</b>（GF-XXXXXX）登入。</p>
        <div style="display:flex;gap:10px;max-width:460px;margin:0 auto">
          <input class="inp" id="passInput" placeholder="Email 或 通行碼" style="flex:1">
          <button class="btn btn-teal" onclick="gfLoginSubmit()">登入</button>
        </div>
        <p id="passMsg" style="text-align:center;font-size:13px;margin-top:8px;color:var(--slate)"></p>
      </div>
    </div>
  </div>`);
  window.GF_PAY_LINKS_HTML = {
    "月費": { 3: payRow(GF_PAY.silver_twd, GF_PAY.silver_usd), 4: payRow(GF_PAY.gold_twd, GF_PAY.gold_usd) },
    "年費": { 3: payRow(GF_PAY.silver_twd_year, GF_PAY.silver_usd_year), 4: payRow(GF_PAY.gold_twd_year, GF_PAY.gold_usd_year) }
  };
}

function gfOpenUpgrade(e, tier) {
  if (e) e.preventDefault();
  gfEnsureUpgradeModal();
  document.getElementById("upgradeModal").classList.add("open");
  if (tier) gfPickTier(tier);
}
function gfPickTier(lv) {
  const t = GF_TIERS.find(x => x.lv === lv);
  document.getElementById("upgForm").style.display = "block";
  document.getElementById("upgTierName").textContent = t.name + "（" + t.price + "）";
  document.getElementById("upgForm").dataset.tier = lv;
  const cyc = (document.querySelector('#upgForm select[name=billing_cycle]') || {}).value || "月費";
  const linkHtml = ((window.GF_PAY_LINKS_HTML || {})[cyc] || {})[lv] || "";
  document.getElementById("upgPayLinks").innerHTML = linkHtml
    ? `<p style="font-size:13px;color:var(--slate);margin-bottom:6px">您可直接透過以下連結完成訂閱付款（付款後仍請送出本表單，以便我們開通權限）：</p>${linkHtml}`
    : `<div class="line-flow">
        <p class="lf-title">💬 本網站目前透過 <b>LINE 官方帳號</b>完成升級與付款，流程如下：</p>
        <ol>
          <li>加入我們的 LINE 官方帳號（ID：<b>${GF_LINE.id}</b>）</li>
          <li>加入後，服務人員將與您聯繫確認方案</li>
          <li>請提供您的 Email，服務人員將提供收款帳號</li>
          <li>確認收款後，平台將以 <b>Email＋LINE</b> 提供您的「會員通行碼」與資格截止期限</li>
        </ol>
        <a class="btn btn-line" href="${GF_LINE.url}" target="_blank" rel="noopener">➕ 加入 LINE 官方帳號 ${GF_LINE.id}</a>
      </div>`;
  document.getElementById("upgForm").scrollIntoView({ behavior: "smooth", block: "nearest" });
}
async function gfUpgradeSubmit(e) {
  e.preventDefault();
  const f = new FormData(e.target);
  const lv = parseInt(document.getElementById("upgForm").dataset.tier, 10);
  const t = GF_TIERS.find(x => x.lv === lv);
  const rec = { name: f.get("name"), email: f.get("email"),
    tier_requested: lv, currency: f.get("currency"),
    billing_cycle: f.get("billing_cycle") || "月費",
    message: f.get("message") || "" };
  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true; btn.textContent = "送出中…";
  /* a) 寫入 Supabase（後台「升級申請」清單） */
  try { if (typeof GF_SB_ENABLED !== "undefined" && GF_SB_ENABLED) await gfSbInsert("upgrade_requests", rec); }
  catch (err) { console.warn("upgrade_requests 寫入失敗：", err.message); }
  /* b) Email 即時通知管理者（Formspree） */
  try {
    await fetch(GF_FORM_ENDPOINT, {
      method: "POST", headers: { "Accept": "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        _subject: "🔔 會員升級申請：" + t.name + "（" + rec.name + "）",
        類型: "會員升級申請", 申請等級: t.name, 姓名: rec.name, Email: rec.email,
        幣別: rec.currency, 繳費週期: rec.billing_cycle, 備註: rec.message
      })
    });
  } catch (err) { console.warn("Formspree 通知失敗：", err.message); }
  document.getElementById("upgOk").style.display = "block";
  btn.textContent = "已送出";
  return false;
}

function gfCycleChange() {
  const lv = parseInt(document.getElementById("upgForm").dataset.tier, 10);
  if (lv) gfPickTier(lv);
}

/* ---------- ⑤ 通行碼輸入 ---------- */
function gfOpenPassEntry(e) {
  if (e) e.preventDefault();
  gfEnsureUpgradeModal();
  document.getElementById("upgradeModal").classList.add("open");
  document.getElementById("passEntry").style.display = "block";
  const inp = document.getElementById("passInput");
  if (!inp.dataset.bound) { inp.dataset.bound = "1"; inp.addEventListener("keydown", ev => { if (ev.key === "Enter") gfLoginSubmit(); }); }
  inp.focus();
}
async function gfLoginSubmit() {
  const val = document.getElementById("passInput").value.trim();
  const msg = document.getElementById("passMsg");
  if (!val) { msg.textContent = "請輸入 Email 或通行碼"; return; }
  msg.textContent = "驗證中…";

  if (val.includes("@")) {
    /* Email 登入 → 青銅會員（付費等級仍須通行碼，確保安全） */
    let lv = 0;
    try { lv = parseInt(await gfSb("/rest/v1/rpc/gf_login_email", { method: "POST", body: { p_email: val } }), 10) || 0; }
    catch (e) { msg.textContent = "登入失敗：" + e.message; return; }
    if (lv >= 2) {
      gfSetTier(2, ""); sessionStorage.setItem("gf_email", val);
      msg.textContent = "✅ 已登入 " + gfTierBadge(2) + "，頁面即將重新整理…";
      setTimeout(() => location.reload(), 700);
    } else if (lv === 1) {
      msg.innerHTML = '您已是會員，但尚未訂閱電子報（青銅需訂閱）。<a href="#" onclick="gfOptIn(event)">點此一鍵訂閱並登入 →</a>';
    } else {
      msg.textContent = "❌ 查無此 Email，請先點「加入會員/訂閱電子報」免費加入。";
    }
    return;
  }

  /* 通行碼登入 → 白銀／黃金 */
  const lv = await gfVerifyPass(val);
  if (lv >= 3) {
    gfSetTier(lv, val);
    msg.textContent = "✅ 已登入 " + gfTierBadge(lv) + "，頁面即將重新整理…";
    setTimeout(() => location.reload(), 700);
  } else {
    msg.textContent = "❌ 通行碼無效、已停用或已到期。若您的訂閱剛到期，續費後即可恢復；請聯繫 guide.ferryman@gmail.com";
  }
}
/* 舊名相容 */
const gfPassSubmit = gfLoginSubmit;

/* 一鍵訂閱：既有會員補訂閱電子報 → 升為青銅並登入 */
async function gfOptIn(e) {
  if (e) e.preventDefault();
  const val = document.getElementById("passInput").value.trim();
  const msg = document.getElementById("passMsg");
  msg.textContent = "處理中…";
  try {
    const lv = parseInt(await gfSb("/rest/v1/rpc/gf_opt_in", { method: "POST", body: { p_email: val } }), 10) || 0;
    if (lv >= 2) {
      gfSetTier(2, ""); sessionStorage.setItem("gf_email", val);
      msg.textContent = "✅ 已訂閱並登入 " + gfTierBadge(2) + "，頁面即將重新整理…";
      setTimeout(() => location.reload(), 700);
    } else msg.textContent = "訂閱失敗，請聯繫 guide.ferryman@gmail.com";
  } catch (err) { msg.textContent = "訂閱失敗：" + err.message; }
}

/* ---------- ⑥ 導覽列注入：隱藏頁連結（依等級）＋ 會員升級鈕 ---------- */
function gfMembershipNav(path) {
  const links = document.querySelector(".nav-links");
  if (!links) return;
  const lv = gfTier();   /* L1＝未登入訪客；L2 以 Email 登入；L3/L4 以通行碼登入 */
  const cta = links.querySelector(".nav-cta");
  let html = "";
  if (lv >= 3) html += `<a href="${path}trends.html" class="nav-premium">📈 產業趨勢分析</a>`;
  if (lv >= 4) html += `<a href="${path}resources.html" class="nav-premium">🏛 政府補助資源</a>`;
  /* 直向小按鈕堆疊：
     未登入 → [⭐會員升級 / 🔑會員登入]
     已登入 → [等級徽章 / ⭐會員升級（最高級則不顯示）] */
  let stack = "";
  if (lv >= 2) {
    /* 已登入：只顯示一顆等級徽章，點擊展開選單（升級／登出），不佔版面 */
    stack = `
    <div class="nav-acct">
      <a href="#" class="nav-tierbadge t${lv}" onclick="gfToggleAcctMenu(event)">${gfTierBadge(lv)} <span class="caret">▾</span></a>
      <div class="nav-menu" id="gfAcctMenu">
        <a href="#" onclick="gfOpenProfile(event)">👤 我的會員資料</a>
        ${lv < 4 ? `<a href="#" onclick="gfOpenUpgrade(event)">⭐ 會員升級</a>` : ""}
        <a href="#" class="danger" onclick="gfMemberLogout();return false;">🚪 會員登出</a>
      </div>
    </div>`;
  } else {
    stack = `<div class="nav-stack">
      <a href="#" class="nav-upgrade" onclick="gfOpenUpgrade(event)">⭐ 會員升級</a>
      <a href="#" class="nav-login" onclick="gfOpenPassEntry(event)">🔑 會員登入</a>
    </div>`;
  }
  html += stack;
  if (cta) cta.insertAdjacentHTML("beforebegin", html);
  else links.insertAdjacentHTML("beforeend", html);
}

/* 徽章選單：點徽章開關、點頁面其他地方自動收合 */
function gfToggleAcctMenu(e) {
  if (e) e.preventDefault();
  const m = document.getElementById("gfAcctMenu");
  if (m) m.classList.toggle("open");
}
document.addEventListener("click", e => {
  const m = document.getElementById("gfAcctMenu");
  if (m && m.classList.contains("open") && !e.target.closest(".nav-acct")) m.classList.remove("open");
});

/* ---------- ⑦ 首頁自動跳出方案廣告（每個瀏覽階段一次） ---------- */
function gfAutoAd() {
  try {
    if (sessionStorage.getItem("gf_ad_seen")) return;
    sessionStorage.setItem("gf_ad_seen", "1");
    setTimeout(() => gfOpenUpgrade(), 2600);
  } catch (e) {}
}

/* ---------- ⑧-0 全站限時免費開放 ---------- */
async function gfInitOpenAccess() {
  if (window.GF_OPEN !== undefined) return window.GF_OPEN;
  try {
    const until = await gfSb("/rest/v1/rpc/gf_open_until", { method: "POST", body: {} });
    window.GF_OPEN = !!until;
    window.GF_OPEN_UNTIL = until || "";
  } catch (e) { window.GF_OPEN = false; }
  if (window.GF_OPEN) gfShowOpenBanner();
  return window.GF_OPEN;
}
/* 有效等級 = 開放期間人人視同黃金 */
function gfEffectiveTier() { return window.GF_OPEN ? 4 : gfTier(); }

function gfShowOpenBanner() {
  if (document.getElementById("gfOpenBanner")) return;
  const d = window.GF_OPEN_UNTIL ? new Date(window.GF_OPEN_UNTIL) : null;
  const untilTxt = d ? (d.getFullYear() + "/" + (d.getMonth() + 1) + "/" + d.getDate() + " " +
    String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0")) : "";
  document.body.insertAdjacentHTML("afterbegin",
    `<div id="gfOpenBanner" class="open-banner">🎉 全站會員內容<b>限時免費開放中</b>${untilTxt ? "（至 " + untilTxt + "）" : ""} — <a href="trends.html">產業趨勢分析</a>・<a href="resources.html">政府補助資源</a></div>`);
  /* 導覽列補上隱藏頁連結（若尚未顯示） */
  const links = document.querySelector(".nav-links");
  if (links && !links.querySelector('a[href$="trends.html"]')) {
    const cta = links.querySelector(".nav-cta");
    const html = `<a href="trends.html" class="nav-premium">📈 產業趨勢分析</a><a href="resources.html" class="nav-premium">🏛 政府補助資源</a>`;
    if (cta) cta.insertAdjacentHTML("beforebegin", html); else links.insertAdjacentHTML("beforeend", html);
  }
}
document.addEventListener("DOMContentLoaded", () => { gfInitOpenAccess(); });

/* ---------- ⑧ 隱藏頁閘門：權限不足時顯示鎖定畫面 ---------- */
function gfGatePage(minLevel, boxId) {
  const lv = gfEffectiveTier();
  if (lv >= minLevel) return true;
  const need = GF_TIERS.find(t => t.lv === minLevel);
  const el = document.getElementById(boxId);
  if (!el) return false;
  if (minLevel <= 2) {
    /* 青銅閘門：免費加入即可解鎖 */
    el.innerHTML = `
    <div class="lock-box">
      <div class="lock-ico">🔒</div>
      <h3>此區為【${GF_TIER_ICON[2]} 青銅會員】以上限定</h3>
      <p>免費加入會員並訂閱電子報，登入後即可查看各州完整投資情報。</p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:18px">
        <button class="btn btn-amber" onclick="gfOpenMember()">免費加入會員/訂閱</button>
        <button class="btn btn-ghost" onclick="gfOpenPassEntry()">已是會員？登入</button>
      </div>
    </div>`;
  } else {
    el.innerHTML = `
    <div class="lock-box">
      <div class="lock-ico">🔒</div>
      <h3>此頁為【${gfTierBadge(minLevel)}】以上限定內容</h3>
      <p>解鎖後可閱讀完整的${minLevel>=4?"政策趨勢分析與台美政府補助資源":"每週產業趨勢分析"}。</p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:18px">
        <button class="btn btn-amber" onclick="gfOpenUpgrade(null,${minLevel})">查看方案並升級</button>
        <button class="btn btn-ghost" onclick="gfOpenPassEntry()">會員登入</button>
      </div>
    </div>`;
  }
  return false;
}


/* ---------- ⑩ 我的會員資料（含資格截止期限） ---------- */
async function gfOpenProfile(e) {
  if (e) e.preventDefault();
  if (!document.getElementById("profileModal")) {
    document.body.insertAdjacentHTML("beforeend", `
    <div class="modal-bg" id="profileModal" onclick="if(event.target===this)gfCloseModal('profileModal')">
      <div class="modal" role="dialog" aria-label="我的會員資料">
        <button class="close" onclick="gfCloseModal('profileModal')">✕</button>
        <p class="kicker" style="margin-bottom:6px">MY ACCOUNT · 我的會員資料</p>
        <div id="profileBody"><p style="color:var(--slate)">載入中…</p></div>
      </div>
    </div>`);
  }
  document.getElementById("profileModal").classList.add("open");
  const box = document.getElementById("profileBody");
  const lv = gfTier();
  const row = (k, v) => `<div class="pf-row"><span>${k}</span><b>${v || "—"}</b></div>`;
  try {
    if (lv >= 3 && gfPass()) {
      const r = (await gfSb("/rest/v1/rpc/gf_pass_info", { method: "POST", body: { p_code: gfPass() } }) || [])[0];
      if (!r) throw new Error("查無資料");
      box.innerHTML = `
        <div class="pf-badge">${gfTierBadge(r.tier_level)}</div>
        ${row("Email", gfEsc(r.email))}
        ${row("繳費週期", r.billing_cycle || "月費")}
        ${row("繳費方式", gfEsc(r.pay_method || "待確認"))}
        ${row("開通日期", (r.created_at || "").slice(0, 10))}
        ${row("⏰ 會員資格截止期限", r.expires_at ? '<span style="color:#B4521B">' + r.expires_at + "</span>" : "無期限")}
        <p class="pf-note">續費或方案異動，請透過 LINE 官方帳號（${GF_LINE.id}）或 guide.ferryman@gmail.com 與我們聯繫。</p>
        <a class="btn btn-line" style="width:100%;text-align:center" href="${GF_LINE.url}" target="_blank" rel="noopener">💬 聯繫 LINE 官方帳號</a>`;
    } else if (lv >= 2) {
      const em = sessionStorage.getItem("gf_email") || "";
      const r = (await gfSb("/rest/v1/rpc/gf_member_info", { method: "POST", body: { p_email: em } }) || [])[0];
      if (!r) throw new Error("查無資料");
      box.innerHTML = `
        <div class="pf-badge">${gfTierBadge(Math.max(r.tier_level || 2, 2))}</div>
        ${row("姓名", gfEsc(r.name))}
        ${row("Email", gfEsc(r.email))}
        ${row("加入日期", gfEsc(r.joined || ""))}
        ${row("電子報訂閱", r.subscribe ? "✅ 訂閱中（每週一發送）" : "未訂閱")}
        ${row("會員資格截止期限", "免費會員・無期限")}
        <p class="pf-note">升級白銀／黃金可解鎖每週產業趨勢與台美補助資源。</p>
        <button class="btn btn-amber" style="width:100%" onclick="gfCloseModal('profileModal');gfOpenUpgrade()">⭐ 查看升級方案</button>`;
    } else {
      box.innerHTML = `<p style="color:var(--slate)">請先登入會員後查看。</p>`;
    }
  } catch (err) {
    box.innerHTML = `<p style="color:var(--slate)">讀取失敗：${gfEsc(err.message)}（請重新登入後再試）</p>`;
  }
}
