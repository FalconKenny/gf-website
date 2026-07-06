# -*- coding: utf-8 -*-
"""
Guide.Ferryman 每週產業分析 + 電子報系統
==========================================
每週一上午自動執行:
  1. 讀取過去 7 天 daily-briefs/*/data.json 的全部動態
  2. 每類別(AI/機器人/半導體/無人機/其他)由 Gemini 以「台美產業分析師」
     視角選定最重要議題,撰寫約 500 字分析文章
     ※「其他」類:若一週內有量子相關議題,以量子為主要撰寫題目
  3. 發布至 articles 表(前台文章區,每類一篇)
  4. 彙整為一份電子報(前言 + 各類別文章 + 週結論),
     存入 weekly-newsletters/,並寄送給全體訂閱會員(members.subscribe = true)

環境變數同每日系統:GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY,
GMAIL_USER, GMAIL_APP_PASSWORD, NOTIFY_EMAIL

本機測試: python weekly_analysis.py --demo
"""

import os, sys, json, html, smtplib, time
import datetime as dt
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from zoneinfo import ZoneInfo

import requests

TAIPEI = ZoneInfo("Asia/Taipei")
TODAY = dt.datetime.now(TAIPEI).date()          # 週一執行
WEEK_START = TODAY - dt.timedelta(days=7)
WEEK_END = TODAY - dt.timedelta(days=1)
DATE_STR = TODAY.strftime("%Y-%m-%d")
WEEK_LABEL = f"{WEEK_START.strftime('%Y/%m/%d')}–{WEEK_END.strftime('%m/%d')}"

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRIEF_DIR = os.path.join(BASE_DIR, "daily-briefs")
OUT_DIR = os.path.join(BASE_DIR, "weekly-newsletters")

CATEGORIES = ["AI", "機器人", "半導體", "無人機", "其他"]
QUANTUM_KW = ["量子", "quantum", "qubit", "qkd"]
ANALYST_PERSONA = (
    "你是台美產業分析師,專長為 AI、機器人、半導體、無人機產業,"
    "核心觀點是協助台灣企業有效鏈結美國供應鏈,並結合工研院技術資源做前瞻趨勢觀測。"
)

# ---------------------------------------------------------------
# 讀取一週資料
# ---------------------------------------------------------------
def load_week_items():
    items = []
    if not os.path.isdir(BRIEF_DIR):
        return items
    for d in sorted(os.listdir(BRIEF_DIR)):
        try:
            day = dt.date.fromisoformat(d)
        except ValueError:
            continue
        if WEEK_START <= day <= WEEK_END:
            p = os.path.join(BRIEF_DIR, d, "data.json")
            if os.path.exists(p):
                with open(p, encoding="utf-8") as f:
                    items.extend(json.load(f))
    return items

# ---------------------------------------------------------------
# Gemini(含重試)
# ---------------------------------------------------------------
def gemini_json(prompt, api_key):
    url = (f"https://generativelanguage.googleapis.com/v1beta/models/"
           f"gemini-2.5-flash:generateContent?key={api_key}")
    body = {"contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json", "temperature": 0.4}}
    for attempt in range(3):
        try:
            r = requests.post(url, json=body, timeout=180)
            r.raise_for_status()
            return json.loads(r.json()["candidates"][0]["content"]["parts"][0]["text"])
        except Exception as ex:
            print(f"[Gemini 第{attempt+1}次失敗] {ex}")
            if attempt < 2:
                time.sleep(20 * (attempt + 1))
    raise RuntimeError("Gemini 重試 3 次皆失敗")

def write_category_article(cat, cat_items, api_key):
    quantum_note = ""
    if cat == "其他":
        q = [x for x in cat_items if any(k in (x["title"] + x.get("summary", "")).lower() for k in QUANTUM_KW)]
        if q:
            cat_items = q + [x for x in cat_items if x not in q][:5]
            quantum_note = "本週有量子相關議題,請以量子科技為主要撰寫題目。"
    src = [{"title": x["title"], "summary": x.get("summary", ""), "implication": x.get("implication", ""),
            "source": x.get("source", ""), "date": x.get("published_at", ""), "region": x.get("region", "")}
           for x in cat_items[:35]]
    prompt = (
        f"{ANALYST_PERSONA}\n"
        f"以下是本週({WEEK_LABEL})「{cat}」類別的動態清單(JSON)。{quantum_note}\n"
        "任務:從中選出本週最熱門或議題最重要的一個主題,以產業分析師視角撰寫繁體中文分析文章。\n"
        "要求:\n"
        "1. title:文章標題,25字以內,點出議題與台灣視角\n"
        "2. summary:文章摘要,60字以內\n"
        "3. body:約500字(450-550字)的分析內文。結構:議題背景與本週進展 → 產業影響分析 → 對台灣企業的具體意涵與建議。"
        "段落間以\\n\\n分隔,語氣專業客觀,基於清單中的事實,不虛構數據。\n"
        "只回傳 JSON:{\"title\":\"...\",\"summary\":\"...\",\"body\":\"...\"}\n\n"
        + json.dumps(src, ensure_ascii=False)
    )
    return gemini_json(prompt, api_key)

def write_intro_outro(articles, api_key):
    briefs = [{"cat": c, "title": a["title"], "summary": a["summary"]} for c, a in articles.items()]
    prompt = (
        f"{ANALYST_PERSONA}\n"
        f"以下是本週({WEEK_LABEL})電子報的各類別文章。請撰寫:\n"
        "1. intro:電子報前言,100-150字,總覽本週台美產業脈動與本期看點\n"
        "2. outro:週整理結論,100-150字,歸納本週趨勢訊號與下週觀察重點\n"
        "只回傳 JSON:{\"intro\":\"...\",\"outro\":\"...\"}\n\n"
        + json.dumps(briefs, ensure_ascii=False)
    )
    return gemini_json(prompt, api_key)

# ---------------------------------------------------------------
# 發布文章至 articles 表
# ---------------------------------------------------------------
def sb_headers(key):
    return {"apikey": key, "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal"}

def publish_articles(articles, url, key):
    rows = []
    for cat, a in articles.items():
        rows.append({
            "id": f"weekly-{TODAY.strftime('%Y%m%d')}-{cat}",
            "cat": cat, "date": DATE_STR, "visible": True,
            "title": a["title"], "summary": a["summary"][:200], "body": a["body"],
        })
    r = requests.post(f"{url}/rest/v1/articles?on_conflict=id",
                      headers=sb_headers(key), json=rows, timeout=60)
    if r.status_code >= 300:
        raise RuntimeError(f"週報文章寫入失敗 {r.status_code}: {r.text[:300]}")
    print(f"[Articles] 已發布 {len(rows)} 篇每週分析:" + "、".join(articles.keys()))

# ---------------------------------------------------------------
# 電子報 HTML
# ---------------------------------------------------------------
CAT_COLORS = {"AI": "#2563EB", "機器人": "#0FA3A8", "半導體": "#7C3AED",
              "無人機": "#E8823D", "其他": "#5B6B7C"}

def render_newsletter(articles, intro, outro):
    def esc(s): return html.escape(str(s or ""))
    def paras(text):
        return "".join(f'<p style="margin:0 0 12px;line-height:1.8">{esc(p)}</p>'
                       for p in str(text).split("\n\n") if p.strip())
    sections = ""
    for cat in CATEGORIES:
        if cat not in articles:
            continue
        a = articles[cat]
        c = CAT_COLORS[cat]
        sections += f"""
    <tr><td style="padding:0 28px 26px">
      <span style="display:inline-block;background:{c};color:#fff;font-size:12px;font-weight:700;border-radius:99px;padding:3px 14px;margin-bottom:10px">{cat}</span>
      <h2 style="margin:0 0 8px;font-size:19px;color:#0A1C30;line-height:1.5">{esc(a['title'])}</h2>
      {paras(a['body'])}
    </td></tr>"""
    return f"""<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="utf-8"></head>
<body style="margin:0;background:#F4F6F7;font-family:'Noto Sans TC','PingFang TC',sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px">
<table width="640" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;max-width:640px">
  <tr><td style="background:#0A1C30;padding:30px 28px">
    <p style="margin:0;color:#0FA3A8;font-size:11px;letter-spacing:.25em;font-weight:700">GUIDE.FERRYMAN WEEKLY</p>
    <h1 style="margin:8px 0 4px;color:#fff;font-size:23px">台美產業動態週報</h1>
    <p style="margin:0;color:#8FA3B5;font-size:13px">{WEEK_LABEL}|AI・機器人・半導體・無人機</p>
  </td></tr>
  <tr><td style="padding:26px 28px 20px">
    <p style="margin:0;font-size:15px;line-height:1.85;color:#33424F">{html.escape(intro)}</p>
  </td></tr>
  {sections}
  <tr><td style="padding:4px 28px 26px">
    <div style="background:#F4F6F7;border-left:4px solid #E8A23D;border-radius:8px;padding:16px 18px">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.1em;color:#E8A23D">本週整理</p>
      <p style="margin:0;font-size:14px;line-height:1.8;color:#33424F">{html.escape(outro)}</p>
    </div>
  </td></tr>
  <tr><td style="background:#0A1C30;padding:20px 28px;text-align:center">
    <p style="margin:0;color:#8FA3B5;font-size:12px">Guide.Ferryman Strategic Advisory · 25.03°N 121.56°E ⇄ 38.90°N 77.03°W</p>
    <p style="margin:6px 0 0;color:#5B6B7C;font-size:11px">您收到本信是因為您是 Guide.Ferryman 會員。完整內容請見官網「台美動態資訊」。</p>
  </td></tr>
</table></td></tr></table></body></html>"""

# ---------------------------------------------------------------
# 寄送
# ---------------------------------------------------------------
def get_subscribers(url, key):
    r = requests.get(f"{url}/rest/v1/members?select=email&subscribe=eq.true",
                     headers={"apikey": key, "Authorization": f"Bearer {key}"}, timeout=30)
    r.raise_for_status()
    return sorted({m["email"].strip() for m in r.json() if m.get("email")})

def send_newsletter(html_body, recipients, user, app_pw, notify):
    subject = f"【Guide.Ferryman 週報】{WEEK_LABEL} 台美產業動態電子報"
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as s:
        s.login(user, app_pw)
        targets = recipients or []
        if notify and notify not in targets:
            targets = [notify] + targets          # 管理者永遠收到一份
        for i in range(0, len(targets), 50):      # 分批 BCC,避開單信收件上限
            batch = targets[i:i+50]
            msg = MIMEMultipart("alternative")
            msg["Subject"], msg["From"], msg["To"] = subject, user, user
            msg["Bcc"] = ", ".join(batch)
            msg.attach(MIMEText(html_body, "html", "utf-8"))
            s.sendmail(user, [user] + batch, msg.as_string())
            time.sleep(2)
    print(f"[電子報] 已寄送給 {len(recipients)} 位訂閱會員(+管理者)")

# ---------------------------------------------------------------
# 主流程
# ---------------------------------------------------------------
def main():
    demo = "--demo" in sys.argv
    os.makedirs(OUT_DIR, exist_ok=True)

    week_items = load_week_items()
    print(f"讀取本週({WEEK_LABEL})動態共 {len(week_items)} 則")

    if demo:
        articles = {c: {"title": f"{c}:本週示範議題分析", "summary": f"{c} 類別示範摘要。",
                        "body": "第一段:議題背景。\n\n第二段:產業影響。\n\n第三段:對台灣企業意涵。"}
                    for c in CATEGORIES[:3]}
        intro, outro = "本週示範前言。", "本週示範結論。"
    else:
        api_key = os.environ["GEMINI_API_KEY"]
        articles = {}
        for cat in CATEGORIES:
            cat_items = [x for x in week_items if x.get("category") == cat]
            if len(cat_items) < 2:
                print(f"[{cat}] 本週僅 {len(cat_items)} 則,跳過")
                continue
            try:
                articles[cat] = write_category_article(cat, cat_items, api_key)
                print(f"[{cat}] 分析文章完成:{articles[cat]['title']}")
                time.sleep(5)
            except Exception as ex:
                print(f"[{cat}] 撰寫失敗:{ex}")
        if not articles:
            print("本週無足夠資料,結束")
            return
        try:
            io = write_intro_outro(articles, api_key)
            intro, outro = io["intro"], io["outro"]
        except Exception as ex:
            print(f"[前言/結論失敗,改用預設] {ex}")
            intro = f"本週({WEEK_LABEL})台美產業動態精選,涵蓋 {'、'.join(articles.keys())} 等領域的重點分析。"
            outro = "以上為本週整理,Guide.Ferryman 將持續為您追蹤台美產業脈動。"

    newsletter = render_newsletter(articles, intro, outro)
    out_path = os.path.join(OUT_DIR, f"{DATE_STR}.html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(newsletter)
    print(f"[存檔] weekly-newsletters/{DATE_STR}.html")

    if demo:
        print("[DEMO 模式] 略過發布與寄送")
        return

    ok = True
    try:
        publish_articles(articles, os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
    except Exception as ex:
        ok = False; print(f"[錯誤] {ex}")
    try:
        subs = get_subscribers(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
        send_newsletter(newsletter, subs, os.environ["GMAIL_USER"],
                        os.environ["GMAIL_APP_PASSWORD"],
                        os.environ.get("NOTIFY_EMAIL") or os.environ["GMAIL_USER"])
    except Exception as ex:
        ok = False; print(f"[錯誤] 電子報寄送:{ex}")

    if not ok:
        sys.exit(1)

if __name__ == "__main__":
    main()
