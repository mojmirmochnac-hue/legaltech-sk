const { parseBody, sendViaResend, json, handleOptions } = require("./_resend");

exports.handler = async (event) => {
  const optionsResponse = handleOptions(event);
  if (optionsResponse) return optionsResponse;

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method Not Allowed" });
  }

  const body = parseBody(event);
  if (!body) {
    return json(400, { error: "Neplatný JSON payload." });
  }

  if (!body.email) {
    return json(400, { error: "Chýba e-mail." });
  }

  return sendViaResend({
    subject: "LegalTech: Digitalizačný audit",
    replyTo: body.email,
    payload: body,
    formType: "audit-email",
  });
};
