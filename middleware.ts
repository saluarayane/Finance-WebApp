import { next, rewrite } from "@vercel/functions/middleware";
import crypto from "node:crypto";

// Roda em toda rota, exceto:
// - /api/*        (as próprias funções de login/logout)
// - /login.html    (a página de login em si)
// - /assets/*      (JS/CSS gerados pelo build do Vite)
// - favicon.ico
export const config = {
  runtime: "nodejs",
  matcher: ["/((?!api/|login\\.html|assets/|favicon\\.ico).*)"],
};

const COOKIE_NAME = "auth_token";

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET não configurada.");
  }
  return secret;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
}

function hasValidAuthCookie(cookieHeader: string | null): boolean {
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

export default function middleware(request: Request) {
  const cookieHeader = request.headers.get("cookie");

  if (hasValidAuthCookie(cookieHeader)) {
    return next();
  }

  // Sem cookie válido: mostra a tela de login no lugar do app,
  // mantendo a URL original na barra de endereço.
  return rewrite(new URL("/login.html", request.url));
}
