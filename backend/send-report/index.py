# smtp.mail.ru / port 465 / app password
import json
import os
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


RECIPIENTS = [
    "spektor@iconfood.ru",
    "sysoev@iconfood.ru",
    "gavrilova@iconfood.ru",
    "e.metla@iconfood.ru",
    "anufriev@iconfood.ru",
    "genkin@iconfood.ru",
    "larionov@iconfood.ru",
    "gukasyan@iconfood.ru",
    "kopichuk@iconfood.ru",
    "kashnikov@iconfood.ru",
    "garaeva@iconfood.ru",
    "lipatov@iconfood.ru",
    "lysenko@iconfood.ru",
    "sidanov@iconfood.ru",
    "maslova@iconfood.ru",
    "bozhkova@iconfood.ru",
    "akramova@iconfood.ru",
    "chernyshev@iconfood.ru",
    "dvoeglazov@blackmarketcafe.ru",
    "semyonova@iconfood.ru",
    "d.solovyova@iconfood.ru",
    "petrakova@iconfood.ru",
]


def build_html(report: dict) -> str:
    """Формирует HTML-письмо на основе данных отчёта проверки."""
    score = report.get("score", 0)
    score_color = "#2d8a4e" if score >= 4 else "#b45309" if score >= 3 else "#dc2626"
    issues_rows = ""
    for item in report.get("issues", []):
        comment = item.get("comment", "")
        photo = item.get("photo", None)
        photo_html = f'<br><img src="{photo}" style="margin-top:8px;max-width:320px;max-height:240px;border-radius:8px;display:block;" />' if photo else ""
        issues_rows += f"""
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f0ece6;font-size:14px;color:#3d2f22;">{item.get("text","")}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0ece6;font-size:13px;color:#6b5745;font-style:italic;">{comment if comment else "—"}{photo_html}</td>
        </tr>"""

    items_rows = ""
    for item in report.get("items", []):
        status = item.get("status", "pending")
        if status == "ok":
            badge = '<span style="background:#dcfce7;color:#166534;padding:2px 8px;border-radius:20px;font-size:12px;font-weight:600;">Зачёт</span>'
        elif status == "issue":
            badge = '<span style="background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:20px;font-size:12px;font-weight:600;">Незачёт</span>'
        elif status == "na":
            badge = '<span style="background:#f3f4f6;color:#6b7280;padding:2px 8px;border-radius:20px;font-size:12px;font-weight:600;">Неакт.</span>'
        else:
            badge = '<span style="background:#f3f4f6;color:#9ca3af;padding:2px 8px;border-radius:20px;font-size:12px;">—</span>'
        items_rows += f"""
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ece6;font-size:13px;color:#3d2f22;">{item.get("text","")}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ece6;text-align:center;">{badge}</td>
        </tr>"""

    fine_block = ""
    if report.get("fine") and report["fine"] > 0:
        fine_block = f"""
        <div style="margin-top:24px;background:#fff1f2;border:1px solid #fecdd3;border-radius:12px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;color:#6b5745;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Итоговый штраф</span>
          <span style="font-size:22px;font-weight:700;color:#dc2626;">−{report['fine']:,} ₽</span>
        </div>"""

    return f"""<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:620px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">

    <!-- Header -->
    <div style="background:#3d2f22;padding:28px 32px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="color:#c9a882;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px;">Отчёт о проверке</div>
        <div style="color:#fff;font-size:22px;font-weight:600;">{report.get("title","")}</div>
        <div style="color:#a88c72;font-size:13px;margin-top:4px;">{report.get("restaurant","")} · {report.get("month","")}</div>
      </div>
      <div style="background:{score_color};border-radius:14px;width:64px;height:64px;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;">
        <span style="color:#fff;font-size:26px;font-weight:700;line-height:1;">{score}</span>
        <span style="color:rgba(255,255,255,.7);font-size:11px;">из 5</span>
      </div>
    </div>

    <!-- Meta -->
    <div style="display:flex;gap:0;border-bottom:1px solid #f0ece6;">
      <div style="flex:1;padding:16px 20px;border-right:1px solid #f0ece6;">
        <div style="font-size:11px;color:#9c836e;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">Проверяющий</div>
        <div style="font-size:15px;font-weight:600;color:#3d2f22;">{report.get("by","")}</div>
      </div>
      <div style="flex:1;padding:16px 20px;border-right:1px solid #f0ece6;">
        <div style="font-size:11px;color:#9c836e;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">Зачётов</div>
        <div style="font-size:15px;font-weight:600;color:#2d8a4e;">{report.get("ok_count",0)} из {report.get("total",0)}</div>
      </div>
      <div style="flex:1;padding:16px 20px;">
        <div style="font-size:11px;color:#9c836e;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">Незачётов</div>
        <div style="font-size:15px;font-weight:600;color:#dc2626;">{report.get("issues_count",0)}</div>
      </div>
    </div>

    <div style="padding:24px 32px;">

      <!-- Нарушения -->
      {f'''<div style="margin-bottom:28px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9c836e;margin-bottom:12px;">Незачёты · комментарии</div>
        <table style="width:100%;border-collapse:collapse;border:1px solid #f0ece6;border-radius:10px;overflow:hidden;">
          <thead>
            <tr style="background:#f9f5f1;">
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b5745;font-weight:600;">Пункт</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b5745;font-weight:600;">Комментарий</th>
            </tr>
          </thead>
          <tbody>{issues_rows}</tbody>
        </table>
      </div>''' if report.get("issues") else ""}

      <!-- Все пункты -->
      <div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9c836e;margin-bottom:12px;">Все пункты проверки</div>
        <table style="width:100%;border-collapse:collapse;border:1px solid #f0ece6;border-radius:10px;overflow:hidden;">
          <tbody>{items_rows}</tbody>
        </table>
      </div>

      {fine_block}

    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;background:#f9f5f1;border-top:1px solid #f0ece6;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:12px;color:#9c836e;">Ресторанный холдинг ICONFOOD</span>
      <span style="font-size:12px;color:#9c836e;">{report.get("time","")}</span>
    </div>

  </div>
</body>
</html>"""


def handler(event: dict, context) -> dict:
    """Отправляет HTML-отчёт о проверке на выбранные email-адреса."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type"}, "body": ""}

    body = json.loads(event.get("body") or "{}")
    recipients = body.get("recipients", [])
    report = body.get("report", {})

    if not recipients:
        return {"statusCode": 400, "headers": {"Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": "Нет получателей"})}
    if not report:
        return {"statusCode": 400, "headers": {"Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": "Нет данных отчёта"})}

    valid = [r for r in recipients if r in RECIPIENTS]
    if not valid:
        return {"statusCode": 400, "headers": {"Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": "Недопустимые адреса"})}

    smtp_host = os.environ.get("SMTP_HOST", "smtp.yandex.ru")
    smtp_port = int(os.environ.get("SMTP_PORT", "465"))
    smtp_user = os.environ.get("SMTP_USER", "")
    smtp_pass = os.environ.get("SMTP_PASS", "")

    html = build_html(report)
    subject = f"Отчёт: {report.get('title','')} · {report.get('restaurant','')} · {report.get('month','')}"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = smtp_user
    msg["To"] = ", ".join(valid)
    msg.attach(MIMEText(html, "html", "utf-8"))

    with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, valid, msg.as_string())

    return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*"}, "body": json.dumps({"ok": True, "sent_to": valid})}