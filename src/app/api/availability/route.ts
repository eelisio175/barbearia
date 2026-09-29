import { getAvailability } from "@/lib/appointments";
import { ensureSeeded } from "@/lib/seed";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeeded();
  const { searchParams } = req.nextUrl;
  const date = searchParams.get("date");
  const barberId = Number(searchParams.get("barberId"));
  const serviceId = Number(searchParams.get("serviceId"));

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !barberId || !serviceId) {
    return Response.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  const result = await getAvailability(date, barberId, serviceId);
  return Response.json(result);
}
