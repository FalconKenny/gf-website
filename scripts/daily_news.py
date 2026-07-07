# -*- coding: utf-8 -*-
"""
Guide.Ferryman 臺美動態資訊 每日自動彙整系統
============================================
流程:
  1. 抓取「前一天」各來源(RSS + Google News)的報導與官方公告
  2. 依 AI / 機器人 / 半導體 / 無人機 / 其他 分類,去除重複
  3. 呼叫 Gemini 免費 API 產生「一句話重點」+「對台灣產業意涵」
  4. 產出知識圖卡 HTML + JSON,存入 daily-briefs/YYYY-MM-DD/
  5. 寫入 Supabase hot_topics 表(沿用網站現有格式)
  6. 寄 Gmail 通知

環境變數(GitHub Secrets):
  GEMINI_API_KEY        Google AI Studio 免費金鑰
  SUPABASE_URL          例如 https://wkwdjtayjzgedvvqdztr.supabase.co
  SUPABASE_SERVICE_KEY  Supabase service_role key(勿用 anon key)
  GMAIL_USER            寄件 Gmail 帳號
  GMAIL_APP_PASSWORD    Gmail 應用程式密碼(16 碼)
  NOTIFY_EMAIL          收通知信箱(未設定時 = GMAIL_USER)
  SUPABASE_TABLE        目標資料表(預設 hot_topics)

本機測試: python daily_news.py --demo   (使用範例資料,不連外部服務)
"""

import os, sys, json, re, html, smtplib, difflib
import datetime as dt
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from urllib.parse import quote, urlparse
from zoneinfo import ZoneInfo

import requests
import feedparser

# ---------------------------------------------------------------
# 基本設定
# ---------------------------------------------------------------
TAIPEI = ZoneInfo("Asia/Taipei")
TODAY = dt.datetime.now(TAIPEI).date()
TARGET_DATE = TODAY - dt.timedelta(days=1)          # 只取「前一天」
DATE_STR = TARGET_DATE.strftime("%Y-%m-%d")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(BASE_DIR, "daily-briefs", DATE_STR)

CATEGORIES = ["AI", "機器人", "半導體", "無人機", "其他"]
REGIONS = {"taiwan": "台灣", "us_federal": "美國聯邦", "us_states": "美國各州"}

# 品牌色(Guide.Ferryman)
BRAND = {
    "ink":   "#0A1C30",   # 墨海藍
    "paper": "#F4F6F7",   # 海圖紙
    "teal":  "#0FA3A8",   # 航道青
    "amber": "#E8A23D",   # 舵燈琥珀
    "gray":  "#5B6B7C",   # 岸線灰
}
CAT_COLORS = {
    "AI": "#0FA3A8", "機器人": "#E8A23D", "半導體": "#3D6B9E",
    "無人機": "#7A5CBF", "其他": "#5B6B7C",
}
REGION_COLORS = {"taiwan": "#0FA3A8", "us_federal": "#0A1C30", "us_states": "#E8A23D"}

# -------- Supabase 寫入設定(已依實際 hot_topics 結構調整:cat / items / updated_at) --------
# 每個類別一列,items 為 JSONB 字串陣列;每日以「前一天動態標題」整批更新該類別
ADD_REGION_TAG = True   # True: 標題前加【台灣】【美聯邦】【美州】;不想要改 False

# ---------------------------------------------------------------
# 1. 抓取
# ---------------------------------------------------------------
def load_sources():
    with open(os.path.join(os.path.dirname(__file__), "sources.json"), encoding="utf-8") as f:
        return json.load(f)

def gnews_url(query, lang):
    q = quote(f"{query} when:1d")
    if lang == "zh":
        return f"https://news.google.com/rss/search?q={q}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant"
    return f"https://news.google.com/rss/search?q={q}&hl=en-US&gl=US&ceid=US:en"

def entry_date(e):
    for key in ("published_parsed", "updated_parsed"):
        t = e.get(key)
        if t:
            return dt.datetime(*t[:6], tzinfo=dt.timezone.utc).astimezone(TAIPEI).date()
    return None

def clean(text, limit=300):
    text = re.sub(r"<[^>]+>", " ", text or "")
    text = html.unescape(re.sub(r"\s+", " ", text)).strip()
    return text[:limit]

def fetch_all(cfg):
    items = []
    for src in cfg["feeds"]:
        url = src["url"] if src["type"] == "rss" else gnews_url(src["query"], src["lang"])
        try:
            resp = requests.get(url, timeout=25, headers={"User-Agent": "Mozilla/5.0 GF-DailyBrief"})
            feed = feedparser.parse(resp.content)
        except Exception as ex:
            print(f"[跳過] {src['name']}: {ex}")
            continue
        for e in feed.entries[:30]:
            d = entry_date(e)
            if d != TARGET_DATE:          # 嚴格只取前一天
                continue
            items.append({
                "title": clean(e.get("title", ""), 200),
                "snippet": clean(e.get("summary", "") or e.get("description", ""), 400),
                "url": e.get("link", ""),
                "source": clean(getattr(e, "source", {}).get("title", "") if e.get("source") else src["name"], 60) or src["name"],
                "region": src["region"],
                "published_at": DATE_STR,
            })
        print(f"[完成] {src['name']}")
    return items

# ---------------------------------------------------------------
# 2. 分類與去重
# ---------------------------------------------------------------
def categorize(item, kw_map):
    text = (item["title"] + " " + item["snippet"]).lower()
    scores = {c: sum(1 for k in kws if k.lower() in text) for c, kws in kw_map.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "其他"

def norm_title(t):
    return re.sub(r"[^0-9a-z\u4e00-\u9fff]", "", t.lower())

def dedupe(items):
    kept = []
    seen_urls = set()
    for it in items:
        u = urlparse(it["url"]).netloc + urlparse(it["url"]).path
        if u in seen_urls:
            continue
        nt = norm_title(it["title"])
        if any(difflib.SequenceMatcher(None, nt, norm_title(k["title"])).ratio() > 0.82 for k in kept):
            continue
        seen_urls.add(u)
        kept.append(it)
    return kept

def cap_items(items, limit):
    out, counter = [], {}
    for it in items:
        key = (it["region"], it["category"])
        if counter.get(key, 0) < limit:
            counter[key] = counter.get(key, 0) + 1
            out.append(it)
    return out

# ---------------------------------------------------------------
# 3. Gemini 摘要(免費額度)
# ---------------------------------------------------------------
def gemini_enrich(items, api_key):
    if not items:
        return items
    payload_items = [{"i": i, "title": x["title"], "snippet": x["snippet"], "source": x["source"]}
                     for i, x in enumerate(items)]
    prompt = (
        "你是台美產業分析師(專長:AI、機器人、半導體、無人機、台美供應鏈鏈結)。"
        "以下是新聞清單(JSON)。請針對每一則,以繁體中文產出:\n"
        "1. one_line:一句話重點,40字以內,精準客觀\n"
        "2. implication:對台灣產業意涵,50字以內,聚焦台灣企業機會/風險/政策訊號;若無明顯關聯填「—」\n"
        "3. category:從 [AI, 機器人, 半導體, 無人機, 其他] 擇一\n"
        "只回傳 JSON 陣列,格式:[{\"i\":0,\"one_line\":\"...\",\"implication\":\"...\",\"category\":\"...\"}]\n\n"
        + json.dumps(payload_items, ensure_ascii=False)
    )
    url = (f"https://generativelanguage.googleapis.com/v1beta/models/"
           f"gemini-2.5-flash:generateContent?key={api_key}")
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseMimeType": "application/json", "temperature": 0.2},
    }
    try:
        text = None
        for attempt in range(3):                     # 502/503 暫時性錯誤自動重試
            try:
                r = requests.post(url, json=body, timeout=120)
                r.raise_for_status()
                text = r.json()["candidates"][0]["content"]["parts"][0]["text"]
                break
            except Exception as ex:
                print(f"[Gemini 第{attempt+1}次失敗] {ex}")
                if attempt < 2:
                    import time; time.sleep(15 * (attempt + 1))
        if text is None:
            raise RuntimeError("Gemini 重試 3 次皆失敗")
        results = json.loads(text)
        for res in results:
            idx = res.get("i")
            if idx is not None and 0 <= idx < len(items):
                items[idx]["summary"] = res.get("one_line", "")[:80]
                items[idx]["implication"] = res.get("implication", "—")[:100]
                if res.get("category") in CATEGORIES:
                    items[idx]["category"] = res["category"]
        print(f"[Gemini] 完成 {len(results)} 則摘要")
    except Exception as ex:
        print(f"[Gemini 失敗,改用原文摘要] {ex}")
    for it in items:  # 保底
        it.setdefault("summary", it["snippet"][:80] or it["title"])
        it.setdefault("implication", "—")
    return items

# ---------------------------------------------------------------
# 4. 知識圖卡 HTML
# ---------------------------------------------------------------
def render_cards(items):
    def card(it):
        c = CAT_COLORS.get(it["category"], BRAND["gray"])
        return f"""
      <article class="card">
        <div class="card-top">
          <span class="tag" style="background:{c}">{it['category']}</span>
          <span class="meta">{html.escape(it['source'])}・{it['published_at']}</span>
        </div>
        <h3><a href="{html.escape(it['url'])}" target="_blank" rel="noopener">{html.escape(it['title'])}</a></h3>
        <p class="oneline">{html.escape(it['summary'])}</p>
        <p class="impl"><span>對台灣產業意涵</span>{html.escape(it['implication'])}</p>
      </article>"""

    sections = ""
    for rkey, rname in REGIONS.items():
        group = [x for x in items if x["region"] == rkey]
        if not group:
            continue
        rc = REGION_COLORS[rkey]
        sections += f"""
    <section>
      <h2 style="border-left:6px solid {rc}">{rname}<small>{len(group)} 則</small></h2>
      <div class="grid">{''.join(card(x) for x in group)}</div>
    </section>"""

    return f"""<!DOCTYPE html>
<html lang="zh-Hant"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>臺美動態知識圖卡|{DATE_STR}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@600;700&family=Noto+Sans+TC:wght@400;500;700&family=IBM+Plex+Mono:wght@500&display=swap" rel="stylesheet">
<style>
  :root {{ --ink:{BRAND['ink']}; --paper:{BRAND['paper']}; --teal:{BRAND['teal']}; --amber:{BRAND['amber']}; --gray:{BRAND['gray']}; }}
  * {{ box-sizing:border-box; margin:0; }}
  body {{ background:var(--paper); color:var(--ink); font-family:'Noto Sans TC',sans-serif; padding:32px 4vw 64px; }}
  header h1 {{ font-family:'Noto Serif TC',serif; font-size:1.7rem; letter-spacing:.04em; }}
  header .date {{ font-family:'IBM Plex Mono',monospace; color:var(--teal); font-size:.95rem; margin-top:4px; }}
  header {{ border-bottom:2px solid var(--ink); padding-bottom:16px; margin-bottom:28px; }}
  section {{ margin-bottom:36px; }}
  h2 {{ font-family:'Noto Serif TC',serif; font-size:1.2rem; padding-left:12px; margin-bottom:14px; }}
  h2 small {{ font-family:'IBM Plex Mono',monospace; font-size:.75rem; color:var(--gray); margin-left:10px; }}
  .grid {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:14px; }}
  .card {{ background:#fff; border:1px solid #dfe4e8; border-radius:10px; padding:16px 18px; display:flex; flex-direction:column; gap:8px; }}
  .card-top {{ display:flex; justify-content:space-between; align-items:center; }}
  .tag {{ color:#fff; font-size:.72rem; font-weight:700; padding:2px 10px; border-radius:99px; }}
  .meta {{ font-family:'IBM Plex Mono',monospace; font-size:.7rem; color:var(--gray); }}
  h3 {{ font-size:.98rem; line-height:1.45; }}
  h3 a {{ color:var(--ink); text-decoration:none; }}
  h3 a:hover {{ color:var(--teal); }}
  .oneline {{ font-size:.86rem; color:#33424f; line-height:1.55; }}
  .impl {{ font-size:.82rem; background:var(--paper); border-radius:6px; padding:8px 10px; line-height:1.5; }}
  .impl span {{ display:block; font-size:.68rem; font-weight:700; color:var(--amber); letter-spacing:.08em; margin-bottom:2px; }}
</style></head><body>
<header>
  <h1>Guide.Ferryman|臺美動態知識圖卡</h1>
  <div class="date">{DATE_STR}(前一日動態)・共 {len(items)} 則</div>
</header>{sections}
</body></html>"""

# ---------------------------------------------------------------
# 5. Supabase 寫入
# ---------------------------------------------------------------
REGION_TAG = {"taiwan": "【台灣】", "us_federal": "【美聯邦】", "us_states": "【美州】"}

def push_supabase(items, url, key, table):
    # 依類別分組 → 每類別一列 upsert(on_conflict=cat)
    # items 內容為物件:{t:標題, s:一句話重點, i:產業意涵, u:原文連結, src:來源, d:日期}
    by_cat = {}
    for it in items:
        tag = REGION_TAG.get(it["region"], "") if ADD_REGION_TAG else ""
        by_cat.setdefault(it["category"], []).append({
            "t": tag + it["title"],
            "s": it.get("summary", ""),
            "i": it.get("implication", "—"),
            "u": it.get("url", ""),
            "src": it.get("source", ""),
            "d": it.get("published_at", DATE_STR),
        })
    if not by_cat:
        print("[Supabase] 無資料可更新")
        return
    now_iso = dt.datetime.now(TAIPEI).isoformat()
    rows = [{"cat": c, "items": objs, "updated_at": now_iso}
            for c, objs in by_cat.items()]
    r = requests.post(
        f"{url}/rest/v1/{table}?on_conflict=cat",
        headers={"apikey": key, "Authorization": f"Bearer {key}",
                 "Content-Type": "application/json",
                 "Prefer": "resolution=merge-duplicates,return=minimal"},
        json=rows, timeout=60,
    )
    if r.status_code >= 300:
        raise RuntimeError(f"Supabase 寫入失敗 {r.status_code}: {r.text[:300]}")
    updated = "、".join(f"{c}({len(t)}則)" for c, t in by_cat.items())
    print(f"[Supabase] 已更新類別:{updated}")

def push_daily_article(items, url, key):
    """每日自動發布一篇「台美產業動態日報」至 articles 表,讓文章區每天有新內容"""
    if not items:
        return
    counts = {}
    for it in items:
        counts[it["category"]] = counts.get(it["category"], 0) + 1
    stat = "、".join(f"{c} {n} 則" for c, n in counts.items())
    top3 = ";".join(it["title"] for it in items[:3])
    summary = f"本日彙整台灣與美國動態共 {len(items)} 則({stat})。精選:{top3}。"[:200]

    lines = []
    for rkey, rname in REGIONS.items():
        group = [x for x in items if x["region"] == rkey]
        if not group:
            continue
        lines.append(f"■ {rname}({len(group)} 則)")
        for it in group:
            lines.append(f"\n【{it['category']}】{it['title']}")
            lines.append(f"・重點:{it['summary']}")
            if it.get("implication") and it["implication"] != "—":
                lines.append(f"・對台灣產業意涵:{it['implication']}")
            lines.append(f"・來源:{it['source']}({it['published_at']}){it['url']}")
        lines.append("")
    body = "\n".join(lines) + "\n(本文由 Guide.Ferryman 每日動態系統自動彙整,資料來源見各則連結)"

    row = {
        "id": f"daily-{DATE_STR}",
        "cat": "其他",
        "date": DATE_STR,
        "title": f"台美產業動態日報|{DATE_STR}",
        "summary": summary,
        "body": body,
    }
    r = requests.post(
        f"{url}/rest/v1/articles?on_conflict=id",
        headers={"apikey": key, "Authorization": f"Bearer {key}",
                 "Content-Type": "application/json",
                 "Prefer": "resolution=merge-duplicates,return=minimal"},
        json=row, timeout=60,
    )
    if r.status_code >= 300:
        raise RuntimeError(f"日報文章寫入失敗 {r.status_code}: {r.text[:300]}")
    print(f"[Articles] 已發布日報文章:台美產業動態日報|{DATE_STR}")

# ---------------------------------------------------------------
# 6. Gmail 通知(含昨日新進會員與新諮詢)
# ---------------------------------------------------------------
def fetch_new_signups(url, key):
    """讀取前一天(含)以後的新會員與新諮詢單,供每日通知信使用"""
    h = {"apikey": key, "Authorization": f"Bearer {key}"}
    consults, members = [], []
    try:
        r = requests.get(f"{url}/rest/v1/consults?created=gte.{TARGET_DATE.isoformat()}"
                         "&select=name,email,company,service,date1,time1&order=created.desc",
                         headers=h, timeout=30)
        if r.ok:
            consults = r.json()
    except Exception as ex:
        print(f"[新諮詢讀取失敗] {ex}")
    try:
        r = requests.get(f"{url}/rest/v1/members?joined=gte.{TARGET_DATE.isoformat()}"
                         "&select=name,email,company,interest,subscribe,tier&order=joined.desc",
                         headers=h, timeout=30)
        if r.ok:
            members = r.json()
    except Exception as ex:
        print(f"[新會員讀取失敗] {ex}")
    return consults, members

def send_mail(items, ok_supabase, user, app_pw, to_addr, consults=None, members=None):
    counts = {}
    for it in items:
        counts.setdefault(REGIONS[it["region"]], {}).setdefault(it["category"], 0)
        counts[REGIONS[it["region"]]][it["category"]] += 1
    lines = "".join(
        f"<p><b>{r}</b>:" + "、".join(f"{c} {n} 則" for c, n in cs.items()) + "</p>"
        for r, cs in counts.items()
    )
    top = "".join(f"<li>{html.escape(it['title'])}<br><small style='color:#5B6B7C'>{html.escape(it['summary'])}</small></li>"
                  for it in items[:8])
    status = "✅ 網站內容已同步更新" if ok_supabase else "⚠️ Supabase 寫入失敗,請查看 Actions log"

    # 昨日新進會員與新諮詢區塊
    signup_html = ""
    if consults:
        rows = "".join(f"<li><b>{html.escape(c.get('name',''))}</b>({html.escape(c.get('company','') or '—')})"
                       f"|{html.escape(c.get('service',''))}|期望 {html.escape(c.get('date1',''))} {html.escape(c.get('time1','') or '')}"
                       f"|{html.escape(c.get('email',''))}</li>" for c in consults)
        signup_html += (f"<h3 style='color:#C0392B'>🔔 新諮詢單 {len(consults)} 件(請至後台確認排程)</h3><ul>{rows}</ul>")
    if members:
        rows = "".join(f"<li>{html.escape(m.get('name',''))}({html.escape(m.get('company','') or '—')})"
                       f"|{html.escape(m.get('interest','') or '—')}|{'訂閱' if m.get('subscribe') else '未訂閱'}"
                       f"|{html.escape(m.get('email',''))}</li>" for m in members)
        signup_html += f"<h3 style='color:#0FA3A8'>👤 新進會員 {len(members)} 位</h3><ul>{rows}</ul>"
    if not consults and not members:
        signup_html = "<p style='color:#5B6B7C;font-size:13px'>昨日無新諮詢單與新會員。</p>"

    body = f"""<div style="font-family:sans-serif;max-width:640px">
<h2 style="color:#0A1C30">Guide.Ferryman 每日臺美動態彙整|{DATE_STR}</h2>
<p>共彙整 <b>{len(items)}</b> 則。{status}。</p>{lines}
{signup_html}
<h3 style="color:#0FA3A8">動態重點預覽</h3><ul>{top}</ul>
<p style="color:#5B6B7C;font-size:13px">知識圖卡已存入 repo:daily-briefs/{DATE_STR}/</p></div>"""
    msg = MIMEMultipart("alternative")
    alert = f"|🔔{len(consults)}件新諮詢" if consults else ""
    msg["Subject"] = f"【GF 每日動態】{DATE_STR} 共 {len(items)} 則|{'更新成功' if ok_supabase else '需檢查'}{alert}"
    msg["From"], msg["To"] = user, to_addr
    msg.attach(MIMEText(body, "html", "utf-8"))
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as s:
        s.login(user, app_pw)
        s.sendmail(user, [to_addr], msg.as_string())
    print(f"[Gmail] 通知已寄至 {to_addr}")

# ---------------------------------------------------------------
# 主流程
# ---------------------------------------------------------------
DEMO_ITEMS = [
    {"title": "商務部公布 CHIPS 第二階段先進封裝補助名單", "snippet": "美國商務部宣布新一輪先進封裝補助…",
     "url": "https://example.com/1", "source": "U.S. Dept of Commerce", "region": "us_federal",
     "published_at": DATE_STR, "category": "半導體",
     "summary": "商務部啟動 CHIPS 先進封裝第二輪補助,聚焦 CoWoS 類產能在美落地。",
     "implication": "台灣封測供應鏈可評估與美方得標廠合資或設點,爭取配套補助。"},
    {"title": "德州宣布新機器人製造園區激勵方案", "snippet": "德州州長辦公室宣布…",
     "url": "https://example.com/2", "source": "Office of the Texas Governor", "region": "us_states",
     "published_at": DATE_STR, "category": "機器人",
     "summary": "德州推出機器人製造園區稅務激勵,鎖定人形機器人組裝與零組件。",
     "implication": "台灣減速器、馬達廠可藉激勵方案降低赴德州設組裝線成本。"},
    {"title": "經濟部擴大無人機海外拓銷補助", "snippet": "國際貿易署公告…",
     "url": "https://example.com/3", "source": "經濟部", "region": "taiwan",
     "published_at": DATE_STR, "category": "無人機",
     "summary": "貿易署擴大無人機廠商海外拓銷補助,單一聯盟最高 2,000 萬元。",
     "implication": "無人機業者可搭配美國州級採購需求,以聯盟形式進軍北美市場。"},
]

def main():
    demo = "--demo" in sys.argv
    os.makedirs(OUT_DIR, exist_ok=True)

    if demo:
        items = DEMO_ITEMS
        print("[DEMO 模式] 使用範例資料")
    else:
        cfg = load_sources()
        raw = fetch_all(cfg)
        print(f"抓取共 {len(raw)} 則(限定 {DATE_STR})")
        for it in raw:
            it["category"] = categorize(it, cfg["分類關鍵字"])
        items = cap_items(dedupe(raw), cfg.get("每區每類上限", 5))
        print(f"去重與上限後 {len(items)} 則")
        items = gemini_enrich(items, os.environ["GEMINI_API_KEY"])

    # 知識圖卡 + JSON 存檔
    with open(os.path.join(OUT_DIR, "knowledge-cards.html"), "w", encoding="utf-8") as f:
        f.write(render_cards(items))
    with open(os.path.join(OUT_DIR, "data.json"), "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    print(f"[存檔] daily-briefs/{DATE_STR}/")

    if demo:
        print("[DEMO 模式] 略過 Supabase 與 Gmail")
        return

    ok = True
    if items:
        try:
            push_supabase(items, os.environ["SUPABASE_URL"],
                          os.environ["SUPABASE_SERVICE_KEY"],
                          os.environ.get("SUPABASE_TABLE") or "hot_topics")
        except Exception as ex:
            ok = False
            print(f"[錯誤] {ex}")
        try:
            push_daily_article(items, os.environ["SUPABASE_URL"],
                               os.environ["SUPABASE_SERVICE_KEY"])
        except Exception as ex:
            ok = False
            print(f"[錯誤] {ex}")

    try:
        new_consults, new_members = fetch_new_signups(
            os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
        send_mail(items, ok,
                  os.environ["GMAIL_USER"], os.environ["GMAIL_APP_PASSWORD"],
                  os.environ.get("NOTIFY_EMAIL") or os.environ["GMAIL_USER"],
                  consults=new_consults, members=new_members)
    except Exception as ex:
        print(f"[Gmail 失敗] {ex}")

    if not ok:
        sys.exit(1)

if __name__ == "__main__":
    main()
