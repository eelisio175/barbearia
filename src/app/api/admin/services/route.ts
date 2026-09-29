import { db } from "@/db";
import { services } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";
import { asc, eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Não autorizado" }, { status: 401 });
  await ensureSeeded();
  const rows = await db.select().from(services).orderBy(asc(services.id));
  return Response.json({ services: rows });
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return Response.json({ error: "Não autorizado" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    description?: string;
    priceCents?: number;
    durationMin?: number;
  };
  const name = (body.name ?? "").trim();
  const priceCents = Math.round(Number(body.priceCents));
  const durationMin = Math.round(Number(body.durationMin));
  if (!name || !Number.isFinite(priceCents) || priceCents < 0 || !durationMin || durationMin < 15) {
    return Response.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const [created] = await db
    .insert(services)
    .values({ name, description: body.description?.trim() || null, priceCents, durationMin })
    .returning();
  return Response.json({ service: created });
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) return Response.json({ error: "Não autorizado" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as {
    id?: number;
    name?: string;
    description?: string;
    priceCents?: number;
    durationMin?: number;
    active?: boolean;
  };
  const id = Number(body.id);
  if (!id) return Response.json({ error: "ID inválido" }, { status: 400 });

  const patch: Partial<typeof services.$inferInsert> = {};
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if (typeof body.description === "string") patch.description = body.description.trim() || null;
  if (body.priceCents !== undefined) patch.priceCents = Math.round(Number(body.priceCents));
  if (body.durationMin !== undefined) patch.durationMin = Math.round(Number(body.durationMin));
  if (typeof body.active === "boolean") patch.active = body.active;

  const [updated] = await db.update(services).set(patch).where(eq(services.id, id)).returning();
  return Response.json({ service: updated });
}
