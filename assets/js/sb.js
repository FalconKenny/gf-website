/* Guide.Ferryman — Supabase 串接層
   Project URL 與 publishable key 為「公開金鑰」，設計上即放於前端。
   資料安全由 Supabase Row Level Security（RLS）控管：
   ・訪客：只能讀文章／熱門動態、送出會員與諮詢表單。
   ・管理者：需以 Supabase Auth 帳密登入後，才能讀會員資料與管理內容。 */

const GF_SB_URL = "https://wkwdjtayjzgedvvqdztr.supabase.co";
const GF_SB_KEY = "sb_publishable_8ch2sUzLB4nINtulu18nsw_n_9INE2D";
const GF_SB_ENABLED = !!(GF_SB_URL && GF_SB_KEY);

function gfSbToken() { try { return sessionStorage.getItem("gf_sb_token") || ""; } catch (e) { return ""; } }

async function gfSb(path, opt) {
  opt = opt || {};
  const headers = Object.assign({
    "apikey": GF_SB_KEY,
    "Authorization": "Bearer " + (opt.auth && gfSbToken() ? gfSbToken() : GF_SB_KEY),
    "Content-Type": "application/json"
  }, opt.headers || {});
  const res = await fetch(GF_SB_URL + path, {
    method: opt.method || "GET",
    headers: headers,
    body: opt.body ? JSON.stringify(opt.body) : undefined
  });
  if (!res.ok) {
    let msg = "";
    try { msg = (await res.json()).message || ""; } catch (e) {}
    const err = new Error(msg || ("HTTP " + res.status));
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/* ---------- 資料表操作 ---------- */
function gfSbSelect(table, query, auth) {
  return gfSb("/rest/v1/" + table + "?select=*" + (query || ""), { auth: !!auth });
}
function gfSbInsert(table, row, auth) {
  return gfSb("/rest/v1/" + table, {
    method: "POST", body: row, auth: !!auth,
    headers: { "Prefer": "return=minimal" }
  });
}
function gfSbUpdate(table, id, patch) {
  return gfSb("/rest/v1/" + table + "?id=eq." + encodeURIComponent(id), {
    method: "PATCH", body: patch, auth: true
  });
}
function gfSbUpdateBy(table, col, val, patch) {
  return gfSb("/rest/v1/" + table + "?" + col + "=eq." + encodeURIComponent(val), {
    method: "PATCH", body: patch, auth: true
  });
}
function gfSbDelete(table, id) {
  return gfSb("/rest/v1/" + table + "?id=eq." + encodeURIComponent(id), {
    method: "DELETE", auth: true
  });
}

/* ---------- 管理者登入（Supabase Auth） ---------- */
async function gfSbLogin(email, password) {
  const res = await fetch(GF_SB_URL + "/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: { "apikey": GF_SB_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: email, password: password })
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.msg || "登入失敗，請確認帳號密碼");
  }
  sessionStorage.setItem("gf_sb_token", data.access_token);
  sessionStorage.setItem("gf_sb_email", (data.user && data.user.email) || email);
  return data;
}
function gfSbLogout() {
  sessionStorage.removeItem("gf_sb_token");
  sessionStorage.removeItem("gf_sb_email");
}
