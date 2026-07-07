# -*- coding: utf-8 -*-
"""
Guide.Ferryman GA4 流量同步系統
============================================
流程:
  1. 以 Google 服務帳戶(Service Account)呼叫 GA4 Data API
  2. 抓取最近 14 天的每日 活躍使用者 / 工作階段 / 頁面瀏覽
  3. 抓取最近 7 天的 Top 8 熱門頁面
  4. Upsert 寫入 Supabase site_traffic 表
  5. 後台儀表板 admin/index.html 讀取此表呈現真實流量

環境變數(GitHub Secrets):
  GA_PROPERTY_ID           GA4 資源 ID(純數字,例如 987654321)
  GA_SERVICE_ACCOUNT_JSON  服務帳戶金鑰 JSON「完整內容」
  SUPABASE_URL             例如 https://wkwdjtayjzgedvvqdztr.supabase.co
  SUPABASE_SERVICE_KEY     Supabase service_role key(勿用 anon key)

相依套件: pip install requests google-auth
本機測試: python scripts/ga_traffic.py --demo   (寫入假資料,不呼叫 GA)
"""

import os, sys, json
import datetime as dt
from zoneinfo import ZoneInfo

import requests

TAIPEI = ZoneInfo("Asia/Taipei")
TODAY = dt.datetime.now(TAIPEI).date()

GA_PROPERTY_ID = os.environ.get("GA_PROPERTY_ID", "").strip()
GA_SA_JSON     = os.environ.get("GA_SERVICE_ACCOUNT_JSON", "").strip()
SUPABASE_URL   = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY   = os.environ.get("SUPABASE_SERVICE_KEY", "")

DEMO = "--demo" in sys.argv


# ---------------------------------------------------------------
# GA4 Data API
# ---------------------------------------------------------------
def ga_access_token():
    """以服務帳戶 JSON 換取 OAuth access token"""
    from google.oauth2 import service_account
    import google.auth.transport.requests
    info = json.loads(GA_SA_JSON)
    creds = service_account.Credentials.from_service_account_info(
        info, scopes=["https://www.googleapis.com/auth/analytics.readonly"]
    )
    creds.refresh(google.auth.transport.requests.Request())
    return creds.token


def ga_run_report(token, body):
    url = f"https://analyticsdata.googleapis.com/v1beta/properties/{GA_PROPERTY_ID}:runReport"
    r = requests.post(url, json=body, timeout=30,
                      headers={"Authorization": f"Bearer {token}"})
    r.raise_for_status()
    return r.json()


def fetch_daily_metrics(token, days=14):
    """回傳 {date: {users, sessions, pageviews}}"""
    body = {
        "dateRanges": [{"startDate": f"{days}daysAgo", "endDate": "yesterday"}],
        "dimensions": [{"name": "date"}],
        "metrics": [{"name": "activeUsers"},
                    {"name": "sessions"},
                    {"name": "screenPageViews"}],
        "orderBys": [{"dimension": {"dimensionName": "date"}}],
    }
    data = ga_run_report(token, body)
    out = {}
    for row in data.get("rows", []):
        d = row["dimensionValues"][0]["value"]          # YYYYMMDD
        iso = f"{d[0:4]}-{d[4:6]}-{d[6:8]}"
        m = [int(v["value"]) for v in row["metricValues"]]
        out[iso] = {"users": m[0], "sessions": m[1], "pageviews": m[2]}
    return out


def fetch_top_pages(token, days=7, limit=8):
    """回傳 [{path, views}] 最近 N 天熱門頁面"""
    body = {
        "dateRanges": [{"startDate": f"{days}daysAgo", "endDate": "yesterday"}],
        "dimensions": [{"name": "pagePath"}],
        "metrics": [{"name": "screenPageViews"}],
        "orderBys": [{"metric": {"metricName": "screenPageViews"}, "desc": True}],
        "limit": limit,
    }
    data = ga_run_report(token, body)
    return [
        {"path": row["dimensionValues"][0]["value"],
         "views": int(row["metricValues"][0]["value"])}
        for row in data.get("rows", [])
    ]


# ---------------------------------------------------------------
# Supabase upsert
# ---------------------------------------------------------------
def sb_upsert(rows):
    if not rows:
        print("no rows to upsert"); return
    url = f"{SUPABASE_URL}/rest/v1/site_traffic?on_conflict=date"
    r = requests.post(url, json=rows, timeout=30, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    })
    r.raise_for_status()
    print(f"upserted {len(rows)} rows into site_traffic")


# ---------------------------------------------------------------
# 主流程
# ---------------------------------------------------------------
def main():
    if DEMO:
        import random
        rows = []
        for i in range(14, 0, -1):
            d = (TODAY - dt.timedelta(days=i)).isoformat()
            u = random.randint(20, 120)
            rows.append({"date": d, "users": u, "sessions": int(u * 1.3),
                         "pageviews": int(u * 2.4),
                         "top_pages": [{"path": "/gf-website/", "views": u}],
                         "updated_at": dt.datetime.now(TAIPEI).isoformat()})
        sb_upsert(rows)
        return

    missing = [k for k, v in {
        "GA_PROPERTY_ID": GA_PROPERTY_ID, "GA_SERVICE_ACCOUNT_JSON": GA_SA_JSON,
        "SUPABASE_URL": SUPABASE_URL, "SUPABASE_SERVICE_KEY": SUPABASE_KEY,
    }.items() if not v]
    if missing:
        print("missing env:", ", ".join(missing)); sys.exit(1)

    token = ga_access_token()
    daily = fetch_daily_metrics(token, days=14)
    top   = fetch_top_pages(token, days=7)
    now   = dt.datetime.now(TAIPEI).isoformat()

    rows = []
    for iso, m in sorted(daily.items()):
        rows.append({
            "date": iso, "users": m["users"], "sessions": m["sessions"],
            "pageviews": m["pageviews"],
            # top_pages 只存在最新一天那列,避免重複
            "top_pages": top if iso == max(daily) else [],
            "updated_at": now,
        })
    sb_upsert(rows)
    print("GA4 traffic sync done:", ", ".join(f"{r['date']}={r['users']}u" for r in rows[-3:]))


if __name__ == "__main__":
    main()
