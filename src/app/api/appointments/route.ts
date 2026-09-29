import { db } from "@/db";
import { appointments, barbers, services } from "@/db/schema";
import { getAvailability, todayISO } from "@/lib/appointments";
import { ensureSeeded, getSettingsMap } from "@/lib/seed";
import { buildWhatsAppLink, customerMessage, normalizePhone } from "@/lib/whatsapp";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  await ensureSeeded();
  let body: {
    customerName?: string;
    customerPhone?: string;
    serviceId?: number;
    barberId?: number;
    date?: string;
    time?: string;
    notes?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const customerName = (body.customerName ?? "").trim();
  const phone = normalizePhone(body.customerPhone ?? "");
  const serviceId = Number(body.serviceId);
  const barberId = Number(body.barberId);
  const date = body.date ?? "";
  const time = body.time ?? "";

  if (customerName.length < 2) {
    return Response.json({ error: "Informe seu nome." }, { status: 400 });
  }
  if (phone.length < 12) {
    return Response.json({ error: "Informe um WhatsApp válido com DDD." }, { status: 400 });
  }
  if (!serviceId || !barberId) {
    return Response.json({ error: "Selecione serviço e barbeiro." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return Response.json({ error: "Data ou horário inválidos." }, { status: 400 });
  }
  if (date < todayISO()) {
    return Response.json({ error: "Escolha uma data futura." }, { status: 400 });
  }

  const [service] = await db.select().from(services).where(eq(services.id, serviceId));
  const [barber] = await db.select().from(barbers).where(eq(barbers.id, barberId));
  if (!service || !barber) {
    return Response.json({ error: "Serviço ou barbeiro não encontrado." }, { status: 404 });
  }

  const { slots, closed } = await getAvailability(date, barberId, serviceId);
  if (closed) {
    return Response.json({ error: "Não abrimos neste dia." }, { status: 409 });
  }
  const slot = slots.find((s) => s.time === time);
  if (!slot || !slot.available) {
    return Response.json(
      { error: "Este horário não está mais disponível. Escolha outro." },
      { status: 409 },
    );
  }

  const [created] = await db
    .insert(appointments)
    .values({
      customerName,
      customerPhone: phone,
      serviceId,
      barberId,
      date,
      time,
      notes: body.notes?.trim() || null,
    })
    .returning();

  const cfg = await getSettingsMap();
  const info = {
    id: created.id,
    customerName,
    serviceName: service.name,
    barberName: barber.name,
    date,
    time,
    priceCents: service.priceCents,
    shopName: cfg.shop_name,
  };

  return Response.json({
    appointment: { ...created, serviceName: service.name, barberName: barber.name, priceCents: service.priceCents },
    whatsappLink: buildWhatsAppLink(cfg.shop_whatsapp, customerMessage(info)),
  });
}
