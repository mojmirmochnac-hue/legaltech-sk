const RESEND_API_URL = "https://api.resend.com/emails";

const FALLBACK_RESEND_API_KEY = "re_8HRyStCw_BtEAkws4fzQW3uTnFVgBjf91";
const CONTACT_EMAIL = process.env.RESEND_TO_EMAIL || "mojmir.mochnac@gmail.com";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "LegalTech <onboarding@resend.dev>";

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

function normalizeValue(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
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

function getApiKey() {
  return process.env.RESEND_API_KEY || FALLBACK_RESEND_API_KEY;
}

function parseBody(event) {
  if (!event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch {
    return null;
  }
}

function handleOptions(event) {
  if (event.httpMethod === "OPTIONS") {
    return json(200, { ok: true });
  }
  return null;
}

async function sendViaResend({ subject, replyTo, payload, formType }) {
  const apiKey = getApiKey();

  if (!apiKey) {
    return json(500, { error: "Chýba API kľúč pre Resend." });
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

  let resendResponse;
  try {
    resendResponse = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });
  } catch (error) {
    return json(502, {
      error: "Nepodarilo sa kontaktovať Resend API.",
      details: String(error),
    });
  }

  const rawText = await resendResponse.text();
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = null;
  }

  if (!resendResponse.ok) {
    const details = parsed?.message || parsed?.error || rawText || "Neznáma chyba";
    return json(502, {
      error: `Resend API vrátilo chybu: ${details}`,
    });
  }

  return json(200, { ok: true, id: parsed?.id || null });
}

module.exports = {
  CONTACT_EMAIL,
  parseBody,
  sendViaResend,
  json,
  handleOptions,
};
