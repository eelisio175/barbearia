import { db } from "@/db";
import { barbers, services } from "@/db/schema";
import { ensureSeeded, getSettingsMap } from "@/lib/seed";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  const [svc, brb, cfg] = await Promise.all([
    db.select().from(services).where(eq(services.active, true)).orderBy(asc(services.id)),
    db.select().from(barbers).where(eq(barbers.active, true)).orderBy(asc(barbers.id)),
    getSettingsMap(),
  ]);
  return Response.json({
    services: svc,
    barbers: brb,
    shop: {
      name: cfg.shop_name,
      whatsapp: cfg.shop_whatsapp,
      address: cfg.shop_address,
      openHour: Number(cfg.open_hour),
      closeHour: Number(cfg.close_hour),
    },
  });
}
