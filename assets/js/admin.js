/* Guide.Ferryman — 管理後台共用邏輯
   ⚠️ 目前登入為「示範版」（前端密碼閘門），僅防止一般訪客誤入，
   無法防範刻意破解。正式上線請依部署指南改用 Supabase Auth 或
   將 /admin 移至受保護的環境。 */

const GF_ADMIN_PASS_KEY = "gf_admin_pass";
const GF_ADMIN_DEFAULT_PASS = "ferryman2026";

function gfAdminGate() {
  /* 正式版：Supabase Auth 帳密登入；未設定 Supabase 時退回示範密碼閘門 */
  const sbMode = (typeof GF_SB_ENABLED !== "undefined" && GF_SB_ENABLED);
  if (sbMode && gfSbToken()) return true;
  if (!sbMode && sessionStorage.getItem("gf_admin_in") === "1") return true;

  document.body.innerHTML = sbMode ? `
  <div class="gate">
    <img src="../assets/img/logo.svg" alt="">
    <h2 style="font-family:var(--font-display);margin-bottom:6px">管理後台登入</h2>
    <p style="font-size:13px;color:var(--slate);margin-bottom:20px">Guide.Ferryman Admin Console</p>
    <input class="inp" type="email" id="gateEmail" placeholder="管理者 Email" style="margin-bottom:10px" autocomplete="username">
    <input class="inp" type="password" id="gatePass" placeholder="密碼" style="margin-bottom:14px" autocomplete="current-password">
    <button class="btn btn-teal" style="width:100%" id="gateBtn" onclick="gfGateTry()">登入</button>
    <p class="notice" style="margin-top:16px">以 Supabase Auth 驗證。帳號於 Supabase 後台 Authentication → Users 建立與管理。</p>
  </div>` : `
  <div class="gate">
    <img src="../assets/img/logo.svg" alt="">
    <h2 style="font-family:var(--font-display);margin-bottom:6px">管理後台登入</h2>
    <p style="font-size:13px;color:var(--slate);margin-bottom:20px">Guide.Ferryman Admin Console</p>
    <input class="inp" type="password" id="gatePass" placeholder="請輸入管理密碼" style="margin-bottom:14px">
    <button class="btn btn-teal" style="width:100%" onclick="gfGateTry()">登入</button>
    <p class="notice" style="margin-top:16px">預設密碼：ferryman2026（示範模式）</p>
  </div>`;
  document.getElementById("gatePass").addEventListener("keydown", e => { if (e.key === "Enter") gfGateTry(); });
  return false;
}
async function gfGateTry() {
  const sbMode = (typeof GF_SB_ENABLED !== "undefined" && GF_SB_ENABLED);
  if (sbMode) {
    const btn = document.getElementById("gateBtn");
    btn.disabled = true; btn.textContent = "登入中…";
    try {
      await gfSbLogin(document.getElementById("gateEmail").value.trim(),
                      document.getElementById("gatePass").value);
      location.reload();
    } catch (err) {
      alert(err.message || "登入失敗");
      btn.disabled = false; btn.textContent = "登入";
    }
    return;
  }
  const pass = localStorage.getItem(GF_ADMIN_PASS_KEY) || GF_ADMIN_DEFAULT_PASS;
  if (document.getElementById("gatePass").value === pass) {
    sessionStorage.setItem("gf_admin_in", "1");
    location.reload();
  } else alert("密碼錯誤");
}
function gfAdminLogout() {
  if (typeof gfSbLogout === "function") gfSbLogout();
  sessionStorage.removeItem("gf_admin_in");
  location.href = "../index.html";
}

function gfAdminShell(active, title, sub, contentHTML) {
  document.body.insertAdjacentHTML("afterbegin", `
  <nav class="nav"><div class="nav-in">
    <a class="brand" href="../index.html">
      <img src="../assets/img/logo.svg" alt="">
      <span><span class="brand-name">Guide.Ferryman</span><br><span class="brand-sub">Admin Console</span></span>
    </a>
    <div class="nav-links" style="display:flex">
      <a href="../index.html" target="_blank">檢視前台 ↗</a>
      <a href="#" onclick="gfAdminLogout();return false;">登出</a>
    </div>
  </div></nav>
  <div class="admin-layout">
    <aside class="admin-side">
      <p class="lbl">Console</p>
      <a href="index.html" class="${active==='dash'?'active':''}">📊 儀表板</a>
      <p class="lbl">內容</p>
      <a href="articles.html" class="${active==='art'?'active':''}">📝 文章管理</a>
      <a href="premium.html" class="${active==='prem'?'active':''}">🔒 進階內容管理</a>
      <a href="newsletter.html" class="${active==='news'?'active':''}">📮 推播內容管理</a>
      <p class="lbl">客戶</p>
      <a href="members.html" class="${active==='mem'?'active':''}">👥 會員與訂閱者</a>
      <a href="upgrades.html" class="${active==='upg'?'active':''}">⭐ 升級申請與通行碼</a>
      <a href="consults.html" class="${active==='con'?'active':''}">🗓 諮詢排程管理</a>
    </aside>
    <main class="admin-main">
      ${(typeof GF_SB_ENABLED !== "undefined" && GF_SB_ENABLED)
    ? '<div class="demo-note" style="background:rgba(15,163,168,.08);border-color:rgba(15,163,168,.35)">☁️ 已連線 Supabase 雲端資料庫 · 登入者：' + (sessionStorage.getItem("gf_sb_email")||"") + '</div>'
    : '<div class="demo-note">⚠️ 示範模式：資料儲存於此瀏覽器（localStorage）。</div>'}
      <h1>${title}</h1>
      <p class="sub">${sub}</p>
      ${contentHTML}
    </main>
  </div>`);
}

/* ---------- Google 日曆事件連結（免 API、立即可用） ---------- */
function gfCalendarURL(c) {
  const d = (c.date1 || "").replace(/-/g, "");
  let start = "T090000", end = "T100000";
  if ((c.time1 || "").includes("下午")) { start = "T133000"; end = "T143000"; }
  if ((c.time1 || "").includes("晚間")) { start = "T190000"; end = "T200000"; }
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: `【諮詢】${c.name}｜${c.service}`,
    dates: `${d}${start}/${d}${end}`,
    details: `客戶：${c.name}（${c.company || "—"}）\nEmail：${c.email}\n需求：${c.need}\n（由 Guide.Ferryman 官網諮詢表單建立）`,
    ctz: "Asia/Taipei"
  });
  return "https://calendar.google.com/calendar/render?" + p.toString();
}

/* ---------- Gmail 確認信連結（免 API、立即可用） ---------- */
function gfGmailURL(c, confirmedTime) {
  const p = new URLSearchParams({
    view: "cm", fs: "1", to: c.email,
    su: `【Guide.Ferryman】諮詢預約確認：${c.date1} ${confirmedTime || c.time1 || ""}`,
    body: `${c.name} 您好：\n\n感謝您透過 Guide.Ferryman Strategic Advisory 官網預約諮詢，已完成填單確認。\n\n▍預計諮詢時間：${c.date1} ${confirmedTime || c.time1 || "（時段確認中）"}\n▍諮詢主題：${c.service}\n\n屆時我們將依您留下的聯絡方式與您聯繫；若需調整時間，請直接回覆本信。\n\nGuide.Ferryman Strategic Advisory\n跨越太平洋的產業擺渡人`
  });
  return "https://mail.google.com/mail/?" + p.toString();
}

function gfEsc(s) { return String(s || "").replace(/</g, "&lt;"); }
function gfCSV(rows, filename) {
  const csv = rows.map(r => r.map(x => `"${String(x ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv" }));
  a.download = filename; a.click();
}
