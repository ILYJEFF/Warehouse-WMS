import { createHash } from "crypto";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";

const ISSUER = "Techchefs";

export function generateTotpSecret() {
  const secret = new OTPAuth.Secret({ size: 20 });
  return secret.base32;
}

function totpFromSecret(secretBase32: string, label: string) {
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });
}

export function getTotpUri(secretBase32: string, email: string) {
  return totpFromSecret(secretBase32, email).toString();
}

export async function getTotpQrDataUrl(secretBase32: string, email: string) {
  return QRCode.toDataURL(getTotpUri(secretBase32, email), {
    margin: 1,
    width: 220,
    errorCorrectionLevel: "M",
  });
}

export function verifyTotpCode(secretBase32: string, code: string, email = "user") {
  const cleaned = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(cleaned)) return false;
  const delta = totpFromSecret(secretBase32, email).validate({
    token: cleaned,
    window: 1,
  });
  return delta !== null;
}

export function maskSecret(secretBase32: string) {
  if (secretBase32.length <= 8) return secretBase32;
  return `${secretBase32.slice(0, 4)}...${secretBase32.slice(-4)}`;
}

/** Stable fingerprint so we do not log raw secrets. */
export function secretFingerprint(secretBase32: string) {
  return createHash("sha256").update(secretBase32).digest("hex").slice(0, 10);
}
