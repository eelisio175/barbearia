import { db } from "@/db";
import { settings } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { getSettingsMap } from "@/lib/seed";
import { onlyDigits } from "@/lib/whatsapp";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED = ["shop_name", "shop_whatsapp", "shop_address", "open_hour", "close_hour"];

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Não autorizado" }, { status: 401 });
  const cfg = await getSettingsMap();
  return Response.json({ settings: cfg });
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin())) return Response.json({ error: "Não autorizado" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, string>;

  for (const key of ALLOWED) {
    if (body[key] === undefined) continue;
    let value = String(body[key]).trim();
    if (key === "shop_whatsapp") value = onlyDigits(value);
    if (key === "open_hour" || key === "close_hour") {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 0 || n > 23) {
        return Response.json({ error: "Horário inválido" }, { status: 400 });
      }
      value = String(n);
    }
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } });
  }

  const cfg = await getSettingsMap();
  return Response.json({ settings: cfg });
}
