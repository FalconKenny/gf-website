/* Guide.Ferryman — 前台共用邏輯 */

/* ---------- 導覽列 ---------- */
function gfNav(active) {
  const path = location.pathname.includes("/admin/") ? "../" : "";
  const el = document.getElementById("nav");
  if (!el) return;
  el.innerHTML = `
  <div class="nav-in">
    <a class="brand" href="${path}index.html">
      <img src="${path}assets/img/logo.svg" alt="Guide.Ferryman logo">
      <span>
        <span class="brand-name">Guide.Ferryman</span><br>
        <span class="brand-sub">Strategic Advisory</span>
      </span>
    </a>
    <button class="nav-toggle" aria-label="開啟選單" onclick="document.querySelector('.nav-links').classList.toggle('open')">☰</button>
    <div class="nav-links">
      <a href="${path}index.html" ${active==="home"?'class="active"':''}>首頁</a>
      <a href="${path}services.html" ${active==="svc"?'class="active"':''}>服務項目</a>
      <a href="${path}invest-map.html" ${active==="map"?'class="active"':''}>產業投資地圖</a>
      <a href="${path}insights.html" ${active==="ins"?'class="active"':''}>台美動態資訊</a>
      <a href="${path}about.html" ${active==="about"?'class="active"':''}>關於我們</a>
      <a href="#" class="nav-member" onclick="gfOpenMember(event)">加入會員</a>
      <a href="${path}contact.html" class="nav-cta">預約諮詢</a>
    </div>
  </div>`;
}

/* ---------- 頁尾 ---------- */
function gfFooter() {
  const path = location.pathname.includes("/admin/") ? "../" : "";
  const el = document.getElementById("footer");
  if (!el) return;
  el.innerHTML = `
  <div class="foot-in">
    <div>
      <div class="foot-brand">
        <img src="${path}assets/img/logo.svg" alt="">
        <span><b style="color:#fff;font-family:var(--font-display)">Guide.Ferryman</b><br>
        <span class="mono" style="font-size:10px;letter-spacing:.2em">STRATEGIC ADVISORY</span></span>
      </div>
      <p style="font-size:13.5px;max-width:30em">產業顧問諮詢工作室。作為企業跨越太平洋的擺渡人，鏈結台灣政府資源與美國在地網絡，陪伴 AI、機器人、半導體、無人機產業做出更好的決策。</p>
    </div>
    <div>
      <h4>快速連結</h4>
      <ul>
        <li><a href="${path}services.html">服務項目</a></li>
        <li><a href="${path}invest-map.html">產業投資地圖</a></li>
        <li><a href="${path}insights.html">台美動態資訊</a></li>
        <li><a href="${path}about.html">關於我們</a></li>
        <li><a href="${path}contact.html">預約諮詢</a></li>
        <li><a href="${path}admin/index.html" style="opacity:.5">管理後台</a></li>
      </ul>
    </div>
    <div>
      <h4>聯絡我們</h4>
      <ul>
        <li><a href="${path}contact.html">諮詢表單</a></li>
        <li><span style="font-size:13.5px">Email：待補（部署時設定）</span></li>
        <li><span style="font-size:13.5px">台灣・台北</span></li>
      </ul>
    </div>
  </div>
  <div class="foot-bottom">© ${new Date().getFullYear()} Guide.Ferryman Strategic Advisory · 25.03°N 121.56°E ⇄ 38.90°N 77.03°W</div>`;
}

/* ---------- 會員註冊（示範版：localStorage；正式版接 Supabase Auth） ---------- */
function gfOpenMember(e) {
  if (e) e.preventDefault();
  document.getElementById("memberModal").classList.add("open");
}
function gfCloseModal(id) { document.getElementById(id).classList.remove("open"); }

function gfMemberModalHTML() {
  return `
  <div class="modal-bg" id="memberModal" onclick="if(event.target===this)gfCloseModal('memberModal')">
    <div class="modal" role="dialog" aria-label="加入會員">
      <button class="close" onclick="gfCloseModal('memberModal')">✕</button>
      <p class="kicker">MEMBERSHIP</p>
      <h3>加入 Guide.Ferryman 會員</h3>
      <p style="font-size:14px;color:var(--slate);margin-bottom:18px">免費加入會員，未來將優先收到每週台美產業動態電子報與訂閱制內容。</p>
      <form onsubmit="return gfMemberSubmit(event)">
        <div class="form-grid">
          <div class="field"><label>姓名 <span class="req">*</span></label><input class="inp" name="name" required></div>
          <div class="field"><label>Email <span class="req">*</span></label><input class="inp" type="email" name="email" required></div>
          <div class="field"><label>公司／單位</label><input class="inp" name="company"></div>
          <div class="field"><label>關注領域</label>
            <select class="sel" name="interest">
              <option>AI</option><option>機器人</option><option>半導體</option><option>無人機</option><option>其他</option>
            </select>
          </div>
          <div class="field full"><label><input type="checkbox" name="subscribe" checked> 我願意收到每週產業動態電子報</label></div>
        </div>
        <div class="ok-box" id="memberOk">已完成加入！我們將透過 Email 與您聯繫。</div>
        <div style="margin-top:18px"><button class="btn btn-teal" type="submit">送出</button></div>
        <p class="notice" style="margin-top:14px">※ 您的資料僅用於產業動態通知與服務聯繫，我們不會對外提供。</p>
      </form>
    </div>
  </div>`;
}
async function gfMemberSubmit(e) {
  e.preventDefault();
  const f = new FormData(e.target);
  const rec = {
    id: "m" + Date.now(), name: f.get("name"), email: f.get("email"),
    company: f.get("company") || "", interest: f.get("interest"),
    subscribe: !!f.get("subscribe"), tier: "免費會員",
    joined: new Date().toISOString().slice(0, 10)
  };
  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true; btn.textContent = "送出中…";
  let saved = false;
  if (typeof GF_SB_ENABLED !== "undefined" && GF_SB_ENABLED) {
    try { await gfSbInsert("members", rec); saved = true; }
    catch (err) {
      if (err.status === 409 || /duplicate|unique/i.test(err.message)) {
        alert("這個 Email 已經是會員了，感謝您的支持！");
        btn.disabled = false; btn.textContent = "送出";
        return false;
      }
      console.warn("Supabase 寫入失敗，改存本地：", err.message);
    }
  }
  if (!saved) {
    const members = GF_getLocal("gf_members", []);
    members.push(rec);
    GF_setLocal("gf_members", members);
  }
  document.getElementById("memberOk").style.display = "block";
  btn.textContent = "已送出";
  return false;
}

/* ---------- 文章卡片渲染 + 分類篩選 ---------- */
window.GF_ART_CACHE = null;
async function gfRenderArticles(containerId, opts) {
  opts = opts || {};
  const box = document.getElementById(containerId);
  if (!box) return;
  if (!window.GF_ART_CACHE) window.GF_ART_CACHE = await GF_fetchArticles();
  let list = window.GF_ART_CACHE.slice();
  if (opts.q) {
    const q = opts.q.toLowerCase();
    list = list.filter(a => ((a.title||"") + (a.summary||"") + (a.body||"") + (a.cat||"")).toLowerCase().includes(q));
  }
  if (opts.cat && opts.cat !== "全部") list = list.filter(a => a.cat === opts.cat);
  if (opts.limit) list = list.slice(0, opts.limit);
  if (!list.length) {
    box.innerHTML = `<p style="color:var(--slate)">此分類目前尚無文章，敬請期待。</p>`;
    return;
  }
  box.innerHTML = list.map(a => `
    <article class="art-card">
      <div class="art-meta">
        <span class="art-cat cat-${a.cat}">${a.cat}</span>
        <span class="art-date">${a.date || ""}</span>
      </div>
      <h3><a href="#" onclick="gfOpenArticle('${a.id}');return false;">${a.title}</a></h3>
      <p>${a.summary || ""}</p>
      <a href="#" class="go" style="font-size:13.5px;font-weight:700" onclick="gfOpenArticle('${a.id}');return false;">閱讀全文 →</a>
    </article>`).join("");
}
function gfOpenArticle(id) {
  const a = (window.GF_ART_CACHE || GF_getArticles()).find(x => x.id === id);
  if (!a) return;
  let m = document.getElementById("articleModal");
  if (!m) {
    document.body.insertAdjacentHTML("beforeend",
      `<div class="modal-bg" id="articleModal" onclick="if(event.target===this)gfCloseModal('articleModal')">
        <div class="modal"><button class="close" onclick="gfCloseModal('articleModal')">✕</button>
        <div id="articleModalBody"></div></div></div>`);
    m = document.getElementById("articleModal");
  }
  document.getElementById("articleModalBody").innerHTML = `
    <div class="art-meta"><span class="art-cat cat-${a.cat}">${a.cat}</span><span class="art-date mono">${a.date || ""}</span></div>
    <h3>${a.title}</h3>
    <div class="body">${(a.body || a.summary || "").replace(/</g, "&lt;")}</div>`;
  m.classList.add("open");
}

/* ---------- 每日熱門動態 ---------- */
async function gfRenderHot(containerId, cat) {
  const box = document.getElementById(containerId);
  if (!box) return;
  const hot = await GF_fetchHot();
  const cats = cat ? [cat] : GF_CATEGORIES;
  box.innerHTML = cats.map(c => `
    <div style="margin-bottom:6px">
      <ul class="hot-list">
        ${(hot[c] || []).map(t => `<li><b>${c}</b>${t}</li>`).join("")}
      </ul>
    </div>`).join("");
}

/* ---------- 諮詢表單 ----------
   正式寄信：於部署指南設定 Formspree（免費），把下方 GF_FORM_ENDPOINT
   換成您的 Formspree 網址後，客戶送出即自動寄 Gmail 通知給您。 */
const GF_FORM_ENDPOINT = ""; // 例："https://formspree.io/f/xxxxxxx"

async function gfConsultSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const f = new FormData(form);
  const rec = {
    id: "c" + Date.now(),
    name: f.get("name"), email: f.get("email"), company: f.get("company") || "",
    service: f.get("service"), need: f.get("need"),
    date1: f.get("date1"), time1: f.get("time1") || "",
    status: "待確認",
    created: new Date().toISOString()
  };
  // 寫入 Supabase 資料庫（後台可見）；連線失敗時退回本地儲存
  let savedToDb = false;
  if (typeof GF_SB_ENABLED !== "undefined" && GF_SB_ENABLED) {
    try { await gfSbInsert("consults", rec); savedToDb = true; }
    catch (err) { console.warn("Supabase 寫入失敗，改存本地：", err.message); }
  }
  if (!savedToDb) {
    const list = GF_getLocal("gf_consults", []);
    list.unshift(rec);
    GF_setLocal("gf_consults", list);
  }

  // 若已設定 Formspree，同步寄出 email 通知
  if (GF_FORM_ENDPOINT) {
    try {
      await fetch(GF_FORM_ENDPOINT, {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(rec)
      });
    } catch (err) { console.error("Formspree 送出失敗", err); }
  }
  document.getElementById("consultOk").style.display = "block";
  form.querySelector("button[type=submit]").disabled = true;
  window.scrollTo({ top: document.getElementById("consultOk").offsetTop - 120, behavior: "smooth" });
  return false;
}

/* ---------- 初始化 ---------- */
document.addEventListener("DOMContentLoaded", () => {
  gfFooter();
  if (!document.getElementById("memberModal") && document.getElementById("nav")) {
    document.body.insertAdjacentHTML("beforeend", gfMemberModalHTML());
  }
});


/* ---------- Hero 產業動態搜尋 ---------- */
