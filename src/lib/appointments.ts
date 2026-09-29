import { db } from "@/db";
import { appointments, barbers, services } from "@/db/schema";
import { and, desc, eq, ne } from "drizzle-orm";
import { getSettingsMap } from "./seed";

export const SLOT_MINUTES = 30;

export function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function toTime(minutes: number) {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function todayISO() {
  const now = new Date();
  const tz = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const y = tz.getFullYear();
  const m = String(tz.getMonth() + 1).padStart(2, "0");
  const d = String(tz.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function nowMinutesSP() {
  const tz = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  return tz.getHours() * 60 + tz.getMinutes();
}

export function isSunday(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay() === 0;
}

/**
 * Retorna todos os slots do dia com flag de disponibilidade,
 * considerando a duração do serviço escolhido e os agendamentos existentes do barbeiro.
 */
export async function getAvailability(date: string, barberId: number, serviceId: number) {
  const cfg = await getSettingsMap();
  const openHour = Number(cfg.open_hour ?? 9);
  const closeHour = Number(cfg.close_hour ?? 19);

  const [service] = await db.select().from(services).where(eq(services.id, serviceId));
  const duration = service?.durationMin ?? SLOT_MINUTES;

  const existing = await db
    .select({
      time: appointments.time,
      durationMin: services.durationMin,
    })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .where(
      and(
        eq(appointments.barberId, barberId),
        eq(appointments.date, date),
        ne(appointments.status, "cancelled"),
      ),
    );

  const busy = existing.map((e) => {
    const start = toMinutes(e.time);
    return [start, start + e.durationMin] as const;
  });

  const open = openHour * 60;
  const close = closeHour * 60;
  const isToday = date === todayISO();
  const nowMin = nowMinutesSP();
  const closed = isSunday(date);

  const slots: { time: string; available: boolean }[] = [];
  for (let start = open; start + duration <= close; start += SLOT_MINUTES) {
    const end = start + duration;
    const overlaps = busy.some(([bs, be]) => start < be && end > bs);
    const past = isToday && start <= nowMin;
    slots.push({ time: toTime(start), available: !closed && !overlaps && !past });
  }
  return { slots, closed };
}

export async function listAppointments(filter?: { date?: string; status?: string }) {
  const conditions = [];
  if (filter?.date) conditions.push(eq(appointments.date, filter.date));
  if (filter?.status && filter.status !== "all")
    conditions.push(eq(appointments.status, filter.status));

  const rows = await db
    .select({
      id: appointments.id,
      customerName: appointments.customerName,
      customerPhone: appointments.customerPhone,
      date: appointments.date,
      time: appointments.time,
      status: appointments.status,
      notes: appointments.notes,
      createdAt: appointments.createdAt,
      serviceId: services.id,
      serviceName: services.name,
      priceCents: services.priceCents,
      durationMin: services.durationMin,
      barberId: barbers.id,
      barberName: barbers.name,
    })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .innerJoin(barbers, eq(appointments.barberId, barbers.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(appointments.date), appointments.time);

  return rows;
}

export async function getAppointmentById(id: number) {
  const [row] = await db
    .select({
      id: appointments.id,
      customerName: appointments.customerName,
      customerPhone: appointments.customerPhone,
      date: appointments.date,
      time: appointments.time,
      status: appointments.status,
      notes: appointments.notes,
      serviceName: services.name,
      priceCents: services.priceCents,
      barberName: barbers.name,
    })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .innerJoin(barbers, eq(appointments.barberId, barbers.id))
    .where(eq(appointments.id, id));
  return row ?? null;
}

export type AppointmentRow = Awaited<ReturnType<typeof listAppointments>>[number];
