import { checkPassword, clearAdminCookie, setAdminCookie } from "@/lib/auth";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { password?: string };
  const password = body.password ?? "";
  if (!checkPassword(password)) {
    return Response.json({ error: "Senha incorreta." }, { status: 401 });
  }
  await setAdminCookie();
  return Response.json({ ok: true });
}

export async function DELETE() {
  await clearAdminCookie();
  return Response.json({ ok: true });
}
