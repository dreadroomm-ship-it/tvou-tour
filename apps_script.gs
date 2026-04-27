/* ============================================================================
   TvoY Tour — Apps Script webhook
   Принимает JSON-заявку с сайта, шлёт письмо с PDF-вложением на TARGET_EMAIL.
   ----------------------------------------------------------------------------
   Деплой:
     1. Откройте https://script.google.com под аккаунтом dreadroomm@gmail.com
     2. Новый проект → вставьте этот файл
     3. Deploy → New deployment → Web app
        - Execute as: Me (dreadroomm@gmail.com)
        - Who has access: Anyone
     4. Скопируйте URL (.../macros/s/AKfy.../exec)
     5. Подставьте этот URL в index.html (const WEBHOOK_URL = "...")
   ============================================================================ */

const TARGET_EMAIL = "mashulkamagomedova@gmail.com";
const BRAND        = "TvoY Tour";
const SUBJECT_PFX  = "🌴 TvoY Tour — новая заявка";

function doPost(e) {
  try {
    const raw = (e && e.postData && e.postData.contents) ? e.postData.contents : "";
    const data = raw ? JSON.parse(raw) : {};

    const html = buildHtmlEmail(data);
    const pdf  = buildPdf(data);

    const subject = SUBJECT_PFX + " · " + (data.items && data.items[12] ? safeStr(data.items[12].answer) : "новый турист");

    MailApp.sendEmail({
      to: TARGET_EMAIL,
      subject: subject,
      htmlBody: html,
      attachments: [pdf]
    });

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err && err.message || err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: "TvoY Tour webhook" }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------- HTML письмо ---------- */
function buildHtmlEmail(d) {
  const items = Array.isArray(d.items) ? d.items : [];
  const date  = formatDate(d.date);

  const rows = items.map(it => {
    const num = String(it.num || "");
    const q   = escapeHtml(it.q || "");
    const a   = escapeHtml(it.answer || "—");
    return `
      <tr>
        <td style="padding:14px 16px;border-bottom:1px solid #f0e6dd;vertical-align:top;width:42px;">
          <span style="display:inline-block;min-width:28px;padding:4px 8px;border-radius:8px;background:#1fb59a;color:#fff;font-size:13px;font-weight:700;text-align:center;">${num}</span>
        </td>
        <td style="padding:14px 16px 14px 0;border-bottom:1px solid #f0e6dd;">
          <div style="font-size:13px;color:#0f7a68;font-weight:600;letter-spacing:0.02em;text-transform:uppercase;margin-bottom:4px;">${q}</div>
          <div style="font-size:16px;color:#1a2a2e;font-weight:600;line-height:1.45;">${a}</div>
        </td>
      </tr>`;
  }).join("");

  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:linear-gradient(180deg,#fff5e6 0%,#ffe5d0 50%,#d8f1ea 100%);padding:32px 16px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 14px 40px -16px rgba(31,181,154,0.25);">
      <tr>
        <td style="background:linear-gradient(135deg,#ff8a5b 0%,#ec5f80 100%);padding:28px 32px;color:#fff;">
          <div style="font-family:Georgia,serif;font-size:26px;font-weight:700;letter-spacing:-0.01em;line-height:1.1;">${BRAND}</div>
          <div style="margin-top:6px;font-size:14px;font-weight:600;opacity:0.92;letter-spacing:0.06em;text-transform:uppercase;">Новая заявка от путешественника</div>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 32px 8px;">
          <div style="display:inline-block;padding:6px 12px;border-radius:999px;background:#e8f8f5;color:#0f7a68;font-size:13px;font-weight:700;">${escapeHtml(date)}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 24px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
            ${rows}
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 28px;">
          <div style="background:#fff8ec;border:1px solid #fdecc8;border-radius:14px;padding:16px 18px;font-size:14px;color:#4d5a5e;line-height:1.55;">
            📎 Полная анкета во вложении (PDF). Свяжитесь с туристом по указанным контактам.
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 32px 28px;border-top:1px solid #f0e6dd;font-size:12px;color:#9aa6a3;">
          Отправлено сайтом ${BRAND} · User-Agent: ${escapeHtml(d.user_agent || "—")}
        </td>
      </tr>
    </table>
  </div>`;
}

/* ---------- PDF ---------- */
function buildPdf(d) {
  const items = Array.isArray(d.items) ? d.items : [];
  const date  = formatDate(d.date);

  const rows = items.map(it => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;width:38px;font-weight:700;color:#1fb59a;">${escapeHtml(String(it.num || ""))}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;">
        <div style="font-size:11px;color:#0f7a68;text-transform:uppercase;letter-spacing:0.04em;font-weight:700;margin-bottom:3px;">${escapeHtml(it.q || "")}</div>
        <div style="font-size:13px;color:#1a2a2e;font-weight:600;">${escapeHtml(it.answer || "—")}</div>
      </td>
    </tr>`).join("");

  const html = `
    <html><head><meta charset="utf-8"><title>${BRAND} — анкета</title></head>
    <body style="font-family:Helvetica,Arial,sans-serif;color:#1a2a2e;padding:24px;">
      <div style="border-bottom:3px solid #ff8a5b;padding-bottom:16px;margin-bottom:18px;">
        <div style="font-size:22px;font-weight:700;color:#1a2a2e;">${BRAND} — заявка путешественника</div>
        <div style="font-size:12px;color:#6c7a78;margin-top:4px;">${escapeHtml(date)}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
      <div style="margin-top:24px;padding-top:14px;border-top:1px solid #eee;font-size:11px;color:#9aa6a3;">
        Источник: сайт ${BRAND} · ${escapeHtml(d.user_agent || "")}
      </div>
    </body></html>`;

  const blob = Utilities.newBlob(html, "text/html", "tvou-tour-anketa.html");
  const pdf  = blob.getAs("application/pdf");
  pdf.setName("tvou-tour-anketa.pdf");
  return pdf;
}

/* ---------- helpers ---------- */
function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function safeStr(s) { return String(s == null ? "" : s).slice(0, 80); }
function formatDate(iso) {
  try {
    const d = iso ? new Date(iso) : new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${dd}.${mm}.${yy} · ${hh}:${mi}`;
  } catch (_) { return "—"; }
}
