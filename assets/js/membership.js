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
  /* 台幣（台灣客戶）：綠界 ECPay 或 藍新 NewebPay 的
     「信用卡定期定額 授權/收款連結」貼於此。 */
  silver_twd: "",
  gold_twd:   "",
  /* 美元（國際客戶）：Lemon Squeezy / Polar / Gumroad 的
     訂閱商品 Checkout 連結貼於此。 */
  silver_usd: "",
  gold_usd:   ""
};

const GF_TIERS = [
  { lv:1, key:"free",   name:"普通會員", price:"免費", color:"#5B6B7C",
    perks:["瀏覽台美動態資訊與每日熱門動態","使用美洲產業地圖","預約諮詢"] },
  { lv:2, key:"bronze", name:"青銅會員", price:"免費（加入會員＋訂閱）", color:"#B07A3F",
    perks:["包含普通會員全部權益","每週一收到《台美產業動態週報》","優先取得活動與研究發布通知"] },
  { lv:3, key:"silver", name:"白銀會員", price:"US$100 / 月（NT$3,200）", color:"#8FA6B8",
    perks:["包含青銅會員全部權益","解鎖【每週產業趨勢分析】隱藏頁","台灣×美國 · AI／機器人／半導體／無人機 分類深度短評"] },
  { lv:4, key:"gold",   name:"黃金會員", price:"US$180 / 月（NT$6,000）", color:"#E8A23D",
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
    if (twd) h += `<a class="btn btn-teal btn-pay" href="${twd}" target="_blank" rel="noopener">以台幣付款（信用卡定期定額）</a>`;
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
          <p class="tier-price">${t.price}</p>
          <ul>${t.perks.map(p=>`<li>${p}</li>`).join("")}</ul>
          ${t.lv<=2
            ? `<button class="btn btn-ghost" style="width:100%" onclick="gfCloseModal('upgradeModal');gfOpenMember()">${t.lv===1?"免費加入":"加入並訂閱週報"}</button>`
            : `<button class="btn ${t.lv===4?"btn-amber":"btn-teal"}" style="width:100%" onclick="gfPickTier(${t.lv})">升級為${t.name}</button>`}
        </div>`).join("")}
      </div>

      <!-- 升級表單（選了白銀/黃金後顯示） -->
      <div id="upgForm" style="display:none;margin-top:22px;border-top:1px dashed rgba(10,28,48,.2);padding-top:18px">
        <h4 style="font-family:var(--font-display);margin-bottom:4px">升級為 <span id="upgTierName"></span></h4>
        <p style="font-size:13.5px;color:var(--slate);margin-bottom:12px">送出後我們會立即收到通知；完成付款並經確認後，將以 Email 寄送您的「會員通行碼」以解鎖隱藏頁。</p>
        <form onsubmit="return gfUpgradeSubmit(event)">
          <div class="grid-2">
            <div class="field"><label>姓名 *</label><input class="inp" name="name" required></div>
            <div class="field"><label>Email *</label><input class="inp" type="email" name="email" required></div>
            <div class="field"><label>付款幣別</label>
              <select class="sel" name="currency"><option value="TWD">台幣 TWD</option><option value="USD">美元 USD</option></select></div>
            <div class="field"><label>備註（選填）</label><input class="inp" name="message" placeholder="想了解的產業、發票需求…"></div>
          </div>
          <div id="upgPayLinks" style="margin:10px 0"></div>
          <button class="btn btn-amber" type="submit" style="width:100%">送出升級申請</button>
          <div class="ok-box" id="upgOk">已收到您的升級申請！我們將於 1 個工作日內以 Email 與您確認付款方式與開通時間。</div>
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
  const links = { 3: payRow(GF_PAY.silver_twd, GF_PAY.silver_usd), 4: payRow(GF_PAY.gold_twd, GF_PAY.gold_usd) };
  window.GF_PAY_LINKS_HTML = links;
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
  const linkHtml = (window.GF_PAY_LINKS_HTML || {})[lv] || "";
  document.getElementById("upgPayLinks").innerHTML = linkHtml
    ? `<p style="font-size:13px;color:var(--slate);margin-bottom:6px">您可直接透過以下連結完成訂閱付款（付款後仍請送出本表單，以便我們開通權限）：</p>${linkHtml}`
    : `<p style="font-size:13px;color:var(--slate)">💳 線上金流即將開通。目前送出申請後，我們將以 Email 提供付款方式（信用卡定期定額連結／銀行轉帳）。</p>`;
  document.getElementById("upgForm").scrollIntoView({ behavior: "smooth", block: "nearest" });
}
async function gfUpgradeSubmit(e) {
  e.preventDefault();
  const f = new FormData(e.target);
  const lv = parseInt(document.getElementById("upgForm").dataset.tier, 10);
  const t = GF_TIERS.find(x => x.lv === lv);
  const rec = { name: f.get("name"), email: f.get("email"),
    tier_requested: lv, currency: f.get("currency"), message: f.get("message") || "" };
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
        幣別: rec.currency, 備註: rec.message
      })
    });
  } catch (err) { console.warn("Formspree 通知失敗：", err.message); }
  document.getElementById("upgOk").style.display = "block";
  btn.textContent = "已送出";
  return false;
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
    msg.textContent = "❌ 通行碼無效或已停用，請確認開通信中的通行碼，或聯繫 guide.ferryman@gmail.com";
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
    stack += `<a href="#" class="nav-tierbadge t${lv}" title="點擊登出" onclick="if(confirm('登出會員？'))gfMemberLogout();return false;">${gfTierBadge(lv)}</a>`;
    if (lv < 4) stack += `<a href="#" class="nav-upgrade" onclick="gfOpenUpgrade(event)">⭐ 會員升級</a>`;
  } else {
    stack += `<a href="#" class="nav-upgrade" onclick="gfOpenUpgrade(event)">⭐ 會員升級</a>`;
    stack += `<a href="#" class="nav-login" onclick="gfOpenPassEntry(event)">🔑 會員登入</a>`;
  }
  html += `<div class="nav-stack">${stack}</div>`;
  if (cta) cta.insertAdjacentHTML("beforebegin", html);
  else links.insertAdjacentHTML("beforeend", html);
}

/* ---------- ⑦ 首頁自動跳出方案廣告（每個瀏覽階段一次） ---------- */
function gfAutoAd() {
  try {
    if (sessionStorage.getItem("gf_ad_seen")) return;
    sessionStorage.setItem("gf_ad_seen", "1");
    setTimeout(() => gfOpenUpgrade(), 2600);
  } catch (e) {}
}

/* ---------- ⑧ 隱藏頁閘門：權限不足時顯示鎖定畫面 ---------- */
function gfGatePage(minLevel, boxId) {
  const lv = gfTier();
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
