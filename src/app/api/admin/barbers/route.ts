import { db } from "@/db";
import { barbers } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";
import { asc, eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Não autorizado" }, { status: 401 });
  await ensureSeeded();
  const rows = await db.select().from(barbers).orderBy(asc(barbers.id));
  return Response.json({ barbers: rows });
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return Response.json({ error: "Não autorizado" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { name?: string; specialty?: string };
  const name = (body.name ?? "").trim();
  if (!name) return Response.json({ error: "Informe o nome" }, { status: 400 });
  const [created] = await db
    .insert(barbers)
    .values({ name, specialty: body.specialty?.trim() || null })
    .returning();
  return Response.json({ barber: created });
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) return Response.json({ error: "Não autorizado" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as {
    id?: number;
    name?: string;
    specialty?: string;
    active?: boolean;
  };
  const id = Number(body.id);
  if (!id) return Response.json({ error: "ID inválido" }, { status: 400 });
  const patch: Partial<typeof barbers.$inferInsert> = {};
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if (typeof body.specialty === "string") patch.specialty = body.specialty.trim() || null;
  if (typeof body.active === "boolean") patch.active = body.active;
  const [updated] = await db.update(barbers).set(patch).where(eq(barbers.id, id)).returning();
  return Response.json({ barber: updated });
}
