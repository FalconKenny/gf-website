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
        ${gfShownTier() >= 1 ? `<span class="cur-tier">您目前的等級：${gfTierBadge(gfShownTier())}</span>` : ""}</p>

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

      <!-- 已是付費會員：輸入通行碼 -->
      <div style="margin-top:18px;text-align:center;font-size:13.5px;color:var(--slate)">
        已是白銀／黃金會員？
        <a href="#" onclick="gfOpenPassEntry(event)">輸入會員通行碼解鎖 →</a>
      </div>
      <div id="passEntry" style="display:none;margin-top:12px">
        <p style="text-align:center;font-size:13px;color:var(--slate);margin-bottom:10px">
          🥈 白銀／🥇 黃金會員：輸入開通信中的通行碼即可登入解鎖。<br>
          ⚪ 普通／🥉 青銅會員免登入——加入會員後即自動生效（週報將寄至您的信箱）。</p>
        <div style="display:flex;gap:10px;max-width:420px;margin:0 auto">
          <input class="inp" id="passInput" placeholder="輸入通行碼（如 GF-XXXXXX）" style="flex:1">
          <button class="btn btn-teal" onclick="gfPassSubmit()">解鎖</button>
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
  document.getElementById("passInput").focus();
}
async function gfPassSubmit() {
  const code = document.getElementById("passInput").value.trim();
  const msg = document.getElementById("passMsg");
  msg.textContent = "驗證中…";
  const lv = await gfVerifyPass(code);
  if (lv >= 3) {
    gfSetTier(lv, code);
    msg.textContent = "✅ 已解鎖 " + gfTierBadge(lv) + "，頁面即將重新整理…";
    setTimeout(() => location.reload(), 700);
  } else {
    msg.textContent = "❌ 通行碼無效或已停用，請確認 Email 中的通行碼，或聯繫 guide.ferryman@gmail.com";
  }
}

/* ---------- ⑥ 導覽列注入：隱藏頁連結（依等級）＋ 會員升級鈕 ---------- */
function gfMembershipNav(path) {
  const links = document.querySelector(".nav-links");
  if (!links) return;
  const lv = gfTier();
  const cta = links.querySelector(".nav-cta");
  let html = "";
  if (lv >= 3) html += `<a href="${path}trends.html" class="nav-premium">📈 產業趨勢分析</a>`;
  if (lv >= 4) html += `<a href="${path}resources.html" class="nav-premium">🏛 政府補助資源</a>`;
  html += `<a href="#" class="nav-upgrade" onclick="gfOpenUpgrade(event)">⭐ 會員升級</a>`;
  /* 會員登入鈕：尚未解鎖白銀/黃金時顯示（開啟通行碼輸入） */
  if (lv < 3) html += `<a href="#" class="nav-login" onclick="gfOpenPassEntry(event)">🔑 會員登入</a>`;
  /* 會員等級徽章：符號＋等級名稱（L3/L4 點擊可登出會員專區） */
  const shown = gfShownTier();
  if (lv >= 3) {
    html += `<a href="#" class="nav-tierbadge t${lv}" title="點擊登出會員專區" onclick="if(confirm('登出會員專區？'))gfMemberLogout();return false;">${gfTierBadge(lv)}</a>`;
  } else if (shown >= 1) {
    html += `<span class="nav-tierbadge t${shown}" title="您在本站的會員等級">${gfTierBadge(shown)}</span>`;
  }
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
  if (el) el.innerHTML = `
    <div class="lock-box">
      <div class="lock-ico">🔒</div>
      <h3>此頁為【${need.name}】以上限定內容</h3>
      <p>解鎖後可閱讀完整的${minLevel>=4?"政策趨勢分析與台美政府補助資源":"每週產業趨勢分析"}。</p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:18px">
        <button class="btn btn-amber" onclick="gfOpenUpgrade(null,${minLevel})">查看方案並升級</button>
        <button class="btn btn-ghost" onclick="gfOpenPassEntry()">我有會員通行碼</button>
      </div>
    </div>`;
  return false;
}
