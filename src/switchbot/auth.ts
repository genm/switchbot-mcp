import crypto from "node:crypto";

export interface AuthHeaderInput {
  token: string;
  secret: string;
  now?: () => number;
  nonceFactory?: () => string;
}

export interface SwitchBotAuthHeaders {
  Authorization: string;
  sign: string;
  nonce: string;
  t: string;
}

export function createSwitchBotAuthHeaders({
  token,
  secret,
  now = Date.now,
  nonceFactory = () => crypto.randomUUID(),
}: AuthHeaderInput): SwitchBotAuthHeaders {
  const t = now().toString();
  const nonce = nonceFactory();
  const stringToSign = `${token}${t}${nonce}`;
  const sign = crypto
    .createHmac("sha256", secret)
    .update(stringToSign, "utf8")
    .digest("base64");

  return {
    Authorization: token,
    sign,
    nonce,
    t,
  };
}
