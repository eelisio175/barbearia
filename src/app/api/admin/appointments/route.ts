import { listAppointments } from "@/lib/appointments";
import { isAdmin } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }
  await ensureSeeded();
  const { searchParams } = req.nextUrl;
  const date = searchParams.get("date") || undefined;
  const status = searchParams.get("status") || undefined;
  const rows = await listAppointments({ date, status });
  return Response.json({ appointments: rows });
}
