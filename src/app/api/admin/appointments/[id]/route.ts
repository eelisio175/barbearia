import { db } from "@/db";
import { appointments } from "@/db/schema";
import { getAppointmentById } from "@/lib/appointments";
import { isAdmin } from "@/lib/auth";
import { getSettingsMap } from "@/lib/seed";
import {
  buildWhatsAppLink,
  shopCancelMessage,
  shopConfirmationMessage,
} from "@/lib/whatsapp";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const STATUSES = ["pending", "confirmed", "done", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id: idParam } = await ctx.params;
  const id = Number(idParam);
  const body = (await req.json().catch(() => ({}))) as { status?: string };
  const status = body.status as Status | undefined;

  if (!id || !status || !STATUSES.includes(status)) {
    return Response.json({ error: "Dados inválidos" }, { status: 400 });
  }

  await db.update(appointments).set({ status }).where(eq(appointments.id, id));
  const row = await getAppointmentById(id);
  if (!row) return Response.json({ error: "Não encontrado" }, { status: 404 });

  const cfg = await getSettingsMap();
  const info = { ...row, shopName: cfg.shop_name };

  let whatsappLink: string | null = null;
  if (status === "confirmed") {
    whatsappLink = buildWhatsAppLink(row.customerPhone, shopConfirmationMessage(info));
  } else if (status === "cancelled") {
    whatsappLink = buildWhatsAppLink(row.customerPhone, shopCancelMessage(info));
  }

  return Response.json({ appointment: row, whatsappLink });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id: idParam } = await ctx.params;
  const id = Number(idParam);
  if (!id) return Response.json({ error: "ID inválido" }, { status: 400 });
  await db.delete(appointments).where(eq(appointments.id, id));
  return Response.json({ ok: true });
}
