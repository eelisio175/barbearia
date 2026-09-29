"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Erro ao entrar.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-ink-600 bg-ink-900 p-6 shadow-2xl shadow-black/50"
    >
      <label className="mb-1 block text-sm text-zinc-400">Senha</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
        className="w-full rounded-lg border border-ink-600 bg-ink-800 px-4 py-3 text-white outline-none focus:border-gold-500"
        placeholder="••••••••"
      />
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading || !password}
        className="mt-5 w-full rounded-lg bg-gold-500 py-3 font-semibold text-ink-950 transition hover:bg-gold-400 disabled:opacity-40"
      >
        {loading ? "Entrando…" : "Entrar"}
      </button>
      <p className="mt-4 text-center text-xs text-zinc-600">
        Senha padrão: <code className="text-zinc-400">admin123</code> (defina{" "}
        <code className="text-zinc-400">ADMIN_PASSWORD</code> para alterar)
      </p>
      <p className="mt-4 text-center text-sm">
        <Link href="/" className="text-zinc-500 hover:text-gold-400">
          ← Voltar ao site
        </Link>
      </p>
    </form>
  );
}
