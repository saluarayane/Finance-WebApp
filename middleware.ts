import { next, rewrite } from "@vercel/functions/middleware";
import { hasValidAuthCookie } from "./lib/auth";

// Roda em toda rota, exceto:
// - /api/*        (as próprias funções de login/logout)
// - /login.html    (a página de login em si)
// - /assets/*      (JS/CSS gerados pelo build do Vite)
// - favicon.ico
export const config = {
  runtime: "nodejs",
  matcher: ["/((?!api/|login\\.html|assets/|favicon\\.ico).*)"],
};

export default function middleware(request: Request) {
  const cookieHeader = request.headers.get("cookie");

  if (hasValidAuthCookie(cookieHeader)) {
    return next();
  }

  // Sem cookie válido: mostra a tela de login no lugar do app,
  // mantendo a URL original na barra de endereço.
  return rewrite(new URL("/login.html", request.url));
}
