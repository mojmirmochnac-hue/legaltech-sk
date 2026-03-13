const RESEND_API_URL = "https://api.resend.com/emails";

const CONTACT_EMAIL = process.env.RESEND_TO_EMAIL || "mojmir.mochnac@xolution.sk";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "LegalTech <onboarding@resend.dev>";

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function normalizeValue(value) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function buildHtml(data) {
  return `
    <h2>Nový odoslaný formulár</h2>
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
      ${Object.entries(data)
        .map(([key, value]) => `<tr><td><strong>${key}</strong></td><td>${normalizeValue(value)}</td></tr>`)
        .join("")}
    </table>
  `;
}

async function sendViaResend({ subject, replyTo, payload, formType }) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return json(500, {
      error: "Chýba konfigurácia RESEND_API_KEY v prostredí servera.",
    });
  }

  const emailPayload = {
    from: FROM_EMAIL,
    to: [CONTACT_EMAIL],
    subject,
    html: buildHtml({ formType, ...payload }),
  };

  if (replyTo) {
    emailPayload.reply_to = replyTo;
  }

  const resendResponse = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(emailPayload),
  });

  if (!resendResponse.ok) {
    const resendError = await resendResponse.text();
    return json(502, {
      error: "Resend API vrátilo chybu.",
      details: resendError,
    });
  }

  return json(200, { ok: true });
}

function parseBody(event) {
  if (!event.body) return {};

  try {
    return JSON.parse(event.body);
  } catch {
    return null;
  }
}

module.exports = {
  CONTACT_EMAIL,
  parseBody,
  sendViaResend,
  json,
};
