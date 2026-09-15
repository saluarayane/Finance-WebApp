import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildAuthCookie } from "../lib/auth";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Método não permitido." });
    return;
  }

  const expectedPassword = process.env.ACCESS_PASSWORD;
  if (!expectedPassword) {
    res.status(500).json({ ok: false, error: "ACCESS_PASSWORD não configurada no servidor." });
    return;
  }

  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (password !== expectedPassword) {
    res.status(401).json({ ok: false, error: "Senha incorreta." });
    return;
  }

  res.setHeader("Set-Cookie", buildAuthCookie());
  res.status(200).json({ ok: true });
}
