import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-500/10 text-3xl ring-1 ring-gold-500/40">
            💈
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Painel Administrativo</h1>
          <p className="mt-1 text-sm text-zinc-500">Acesso restrito à equipe da barbearia</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
