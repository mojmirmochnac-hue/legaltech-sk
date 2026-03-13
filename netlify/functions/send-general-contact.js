const { parseBody, sendViaResend, json } = require("./_resend");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method Not Allowed" });
  }

  const body = parseBody(event);
  if (!body) {
    return json(400, { error: "Neplatný JSON payload." });
  }

  if (!body.email || !body.message) {
    return json(400, { error: "Chýba e-mail alebo správa." });
  }

  return sendViaResend({
    subject: "LegalTech: Dotazník na kontaktovanie",
    replyTo: body.email,
    payload: body,
    formType: "general-contact",
  });
};
