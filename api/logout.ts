import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildLogoutCookie } from "../lib/auth";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("Set-Cookie", buildLogoutCookie());
  res.status(200).json({ ok: true });
}
