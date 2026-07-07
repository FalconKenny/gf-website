#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Guide.Ferryman 會員權限到期檢查（每日執行）
------------------------------------------------
1. 掃描 member_passes：
   - 已到期（expires_at < 今日）且仍為 active → 自動停用（前台立即無法登入）
   - 7 日內即將到期 → 列入提醒
2. 有任何項目時，寄 Gmail 摘要給管理者（NOTIFY_EMAIL）

需要的環境變數（與 daily_news.py 相同，GitHub Secrets 已具備）：
  SUPABASE_URL / SUPABASE_SERVICE_KEY / GMAIL_USER / GMAIL_APP_PASSWORD / NOTIFY_EMAIL(選填)
"""
import os, sys, json, smtplib, urllib.request
from datetime import date, datetime
from email.mime.text import MIMEText
from email.header import Header

SB_URL = os.environ["SUPABASE_URL"].rstrip("/")
SB_KEY = os.environ["SUPABASE_SERVICE_KEY"]
TIER = {3: "白銀會員", 4: "黃金會員"}

def sb(path, method="GET", body=None):
    req = urllib.request.Request(SB_URL + path, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY,
                 "Content-Type": "application/json", "Prefer": "return=minimal"})
    with urllib.request.urlopen(req, timeout=30) as r:
        raw = r.read().decode()
        return json.loads(raw) if raw else None

def main():
    today = date.today()
    passes = sb("/rest/v1/member_passes?active=eq.true&select=*") or []
    expired, soon = [], []
    for p in passes:
        exp = p.get("expires_at")
        if not exp:
            continue
        d = (datetime.strptime(exp, "%Y-%m-%d").date() - today).days
        if d < 0:
            expired.append((p, d))
        elif d <= 7:
            soon.append((p, d))

    # 已到期 → 自動停用（前台通行碼即刻失效）
    for p, _ in expired:
        sb("/rest/v1/member_passes?id=eq." + p["id"], "PATCH", {"active": False})

    if not expired and not soon:
        print("今日無到期或即將到期之會員。")
        return

    def row(p, d):
        auto = p.get("auto_renew")
        tip = ("已設自動續費（金流商將自動扣款；扣款成功後請至後台按「⏫ 續期」延長效期）"
               if auto else "未設自動續費（請確認客戶是否續費；已續請按「⏫ 續期」，未續可不處理）")
        return ("・{email}｜{tier}｜{cycle}｜{pay}｜到期日 {exp}｜{state}\n  → {tip}").format(
            email=p.get("email"), tier=TIER.get(p.get("tier_level"), "?"),
            cycle=p.get("billing_cycle") or "月費", pay=p.get("pay_method") or "待確認",
            exp=p.get("expires_at"),
            state=("已到期 %d 天，系統已自動停用" % abs(d)) if d < 0 else ("剩 %d 天" % d),
            tip=tip)

    lines = ["Guide.Ferryman 會員權限到期日報（%s）" % today.isoformat(), ""]
    if expired:
        lines += ["🔴 已到期並自動停權（%d 位）：" % len(expired)] + [row(p, d) for p, d in expired] + [""]
    if soon:
        lines += ["🟡 7 日內即將到期（%d 位）：" % len(soon)] + [row(p, d) for p, d in soon] + [""]
    lines += ["後台管理：https://falconkenny.github.io/gf-website/admin/upgrades.html"]
    body = "\n".join(lines)

    user, pwd = os.environ["GMAIL_USER"], os.environ["GMAIL_APP_PASSWORD"]
    to = os.environ.get("NOTIFY_EMAIL") or user
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = Header("🔔 會員到期提醒：%d 位停權、%d 位即將到期" % (len(expired), len(soon)), "utf-8")
    msg["From"], msg["To"] = user, to
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as s:
        s.login(user, pwd)
        s.sendmail(user, [to], msg.as_string())
    print("已寄出到期摘要：停權 %d、即將到期 %d" % (len(expired), len(soon)))

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("billing_check 失敗：", e, file=sys.stderr)
        sys.exit(1)
