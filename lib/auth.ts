import crypto from "node:crypto";

const COOKIE_NAME = "auth_token";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET não configurada. Defina essa variável de ambiente na Vercel (Project Settings → Environment Variables)."
    );
  }
  return secret;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
}

/** Gera o cabeçalho Set-Cookie para autenticar este navegador/aparelho por 1 ano. */
export function buildAuthCookie(): string {
  const expiresAt = Date.now() + ONE_YEAR_SECONDS * 1000;
  const payload = String(expiresAt);
  const signature = sign(payload);
  const value = encodeURIComponent(`${payload}.${signature}`);

  return [
    `${COOKIE_NAME}=${value}`,
    `Max-Age=${ONE_YEAR_SECONDS}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
  ].join("; ");
}

/** Cabeçalho Set-Cookie para apagar o cookie (usado no logout). */
export function buildLogoutCookie(): string {
  return [`${COOKIE_NAME}=`, "Max-Age=0", "Path=/", "HttpOnly", "Secure", "SameSite=Lax"].join("; ");
}

/** Verifica se o cabeçalho Cookie da requisição contém um token válido e não expirado. */
export function hasValidAuthCookie(cookieHeader: string | null | undefined): boolean {
  if (!cookieHeader) return false;

  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return false;

  const raw = decodeURIComponent(match[1]);
  const separatorIndex = raw.lastIndexOf(".");
  if (separatorIndex === -1) return false;

  const payload = raw.slice(0, separatorIndex);
  const signature = raw.slice(separatorIndex + 1);
  if (!payload || !signature) return false;

  let expectedBuffer: Buffer;
  let signatureBuffer: Buffer;
  try {
    expectedBuffer = Buffer.from(sign(payload), "hex");
    signatureBuffer = Buffer.from(signature, "hex");
  } catch {
    return false;
  }

  if (expectedBuffer.length !== signatureBuffer.length) return false;
  if (!crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) return false;

  const expiresAt = Number(payload);
  if (Number.isNaN(expiresAt) || expiresAt < Date.now()) return false;

  return true;
}
