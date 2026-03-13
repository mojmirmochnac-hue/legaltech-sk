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

  if (!body.email || !body.name) {
    return json(400, { error: "Chýba meno alebo e-mail." });
  }

  return sendViaResend({
    subject: "LegalTech: Generatívna AI dotazník",
    replyTo: body.email,
    payload: body,
    formType: "genai-email",
  });
};
