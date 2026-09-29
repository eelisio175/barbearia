"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDateBR, formatPrice } from "@/lib/whatsapp";
import { WhatsIcon } from "./BookingForm";

type Appt = {
  id: number;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  status: string;
  notes: string | null;
  serviceName: string;
  priceCents: number;
  durationMin: number;
  barberName: string;
};
type Service = {
  id: number;
  name: string;
  description: string | null;
  priceCents: number;
  durationMin: number;
  active: boolean;
};
type Barber = { id: number; name: string; specialty: string | null; active: boolean };

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pendente", cls: "bg-amber-500/15 text-amber-300 ring-amber-500/40" },
  confirmed: { label: "Confirmado", cls: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/40" },
  done: { label: "Concluído", cls: "bg-sky-500/15 text-sky-300 ring-sky-500/40" },
  cancelled: { label: "Cancelado", cls: "bg-red-500/15 text-red-300 ring-red-500/40" },
};

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatPhone(p: string) {
  const d = p.replace(/\D/g, "");
  const local = d.startsWith("55") && d.length >= 12 ? d.slice(2) : d;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return p;
}

type Tab = "agenda" | "servicos" | "barbeiros" | "config";

export default function AdminDashboard({ shopName }: { shopName: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("agenda");

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-ink-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="stripes h-7 w-2 rounded-full" />
            <div>
              <div className="font-display text-base font-bold text-white">{shopName}</div>
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">
                Painel administrativo
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/" className="text-zinc-400 hover:text-gold-400">
              Ver site
            </Link>
            <button
              onClick={logout}
              className="rounded-lg border border-ink-600 px-3 py-1.5 text-zinc-300 hover:bg-ink-700"
            >
              Sair
            </button>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-5">
          {(
            [
              ["agenda", "Agendamentos"],
              ["servicos", "Serviços"],
              ["barbeiros", "Barbeiros"],
              ["config", "Configurações"],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
                tab === key
                  ? "border-gold-500 text-gold-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8">
        {tab === "agenda" && <AgendaTab />}
        {tab === "servicos" && <ServicesTab />}
        {tab === "barbeiros" && <BarbersTab />}
        {tab === "config" && <SettingsTab />}
      </div>
    </main>
  );
}

/* ----------------------------- AGENDA ----------------------------- */

function AgendaTab() {
  const [date, setDate] = useState<string>(localToday());
  const [allDates, setAllDates] = useState(false);
  const [status, setStatus] = useState("all");
  const [rows, setRows] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (!allDates && date) params.set("date", date);
    if (status !== "all") params.set("status", status);
    const res = await fetch(`/api/admin/appointments?${params}`, { cache: "no-store" });
    const data = await res.json();
    setRows(data.appointments ?? []);
    setLoading(false);
  }, [date, allDates, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: number, newStatus: string) {
    const res = await fetch(`/api/admin/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (!res.ok) {
      setToast(data.error ?? "Erro");
      return;
    }
    if (data.whatsappLink) {
      window.open(data.whatsappLink, "_blank", "noopener,noreferrer");
    }
    setToast(
      newStatus === "confirmed"
        ? "Confirmado! Mensagem de WhatsApp aberta para o cliente."
        : "Status atualizado.",
    );
    setTimeout(() => setToast(null), 3500);
    load();
  }

  async function remove(id: number) {
    if (!confirm("Excluir este agendamento definitivamente?")) return;
    await fetch(`/api/admin/appointments/${id}`, { method: "DELETE" });
    load();
  }

  const stats = useMemo(() => {
    const s = { total: rows.length, pending: 0, confirmed: 0, revenue: 0 };
    for (const r of rows) {
      if (r.status === "pending") s.pending++;
      if (r.status === "confirmed") s.confirmed++;
      if (r.status !== "cancelled") s.revenue += r.priceCents;
    }
    return s;
  }, [rows]);

  return (
    <div>
      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Agendamentos" value={String(stats.total)} />
        <Stat label="Pendentes" value={String(stats.pending)} accent="text-amber-300" />
        <Stat label="Confirmados" value={String(stats.confirmed)} accent="text-emerald-300" />
        <Stat label="Receita prevista" value={formatPrice(stats.revenue)} accent="text-gold-400" />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-ink-600 bg-ink-900 p-4">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-zinc-500">Data</label>
          <input
            type="date"
            value={date}
            disabled={allDates}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-gold-500 disabled:opacity-40"
          />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={allDates}
            onChange={(e) => setAllDates(e.target.checked)}
            className="accent-gold-500"
          />
          Todas as datas
        </label>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-zinc-500">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-gold-500"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendentes</option>
            <option value="confirmed">Confirmados</option>
            <option value="done">Concluídos</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>
        <button
          onClick={() => setDate(localToday())}
          className="rounded-lg border border-ink-600 px-3 py-2 text-sm text-zinc-300 hover:bg-ink-700"
        >
          Hoje
        </button>
        <button
          onClick={load}
          className="ml-auto rounded-lg bg-ink-700 px-3 py-2 text-sm text-zinc-200 hover:bg-ink-600"
        >
          ↻ Atualizar
        </button>
      </div>

      {toast && (
        <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {toast}
        </div>
      )}

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-ink-600 bg-ink-900">
        {loading ? (
          <p className="p-8 text-center text-sm text-zinc-500">Carregando…</p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-zinc-500">
            Nenhum agendamento encontrado para este filtro.
          </p>
        ) : (
          <ul className="divide-y divide-ink-700">
            {rows.map((a) => {
              const st = STATUS_LABEL[a.status] ?? STATUS_LABEL.pending;
              return (
                <li key={a.id} className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
                  <div className="flex w-full items-center gap-4 md:w-40">
                    <div className="rounded-lg bg-ink-800 px-3 py-2 text-center">
                      <div className="text-lg font-bold text-white">{a.time}</div>
                      <div className="text-[11px] text-zinc-500">{formatDateBR(a.date)}</div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white">{a.customerName}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${st.cls}`}
                      >
                        {st.label}
                      </span>
                      <span className="text-xs text-zinc-600">#{a.id}</span>
                    </div>
                    <div className="mt-1 text-sm text-zinc-400">
                      {a.serviceName} · {a.barberName} ·{" "}
                      <span className="text-gold-400">{formatPrice(a.priceCents)}</span> ·{" "}
                      {a.durationMin} min
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
                      <a
                        href={`https://wa.me/${a.customerPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#25D366] hover:underline"
                      >
                        <WhatsIcon className="h-4 w-4" /> {formatPhone(a.customerPhone)}
                      </a>
                      {a.notes && <span className="text-zinc-500">📝 {a.notes}</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {a.status === "pending" && (
                      <button
                        onClick={() => updateStatus(a.id, "confirmed")}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-3 py-2 text-sm font-semibold text-ink-950 hover:bg-[#1ebe5a]"
                      >
                        <WhatsIcon className="h-4 w-4" /> Confirmar via WhatsApp
                      </button>
                    )}
                    {a.status === "confirmed" && (
                      <button
                        onClick={() => updateStatus(a.id, "done")}
                        className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm font-semibold text-sky-300 ring-1 ring-sky-500/40 hover:bg-sky-500/30"
                      >
                        ✓ Concluir
                      </button>
                    )}
                    {a.status !== "cancelled" && a.status !== "done" && (
                      <button
                        onClick={() => updateStatus(a.id, "cancelled")}
                        className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
                      >
                        Cancelar
                      </button>
                    )}
                    {a.status === "cancelled" && (
                      <button
                        onClick={() => updateStatus(a.id, "pending")}
                        className="rounded-lg border border-ink-600 px-3 py-2 text-sm text-zinc-300 hover:bg-ink-700"
                      >
                        Reabrir
                      </button>
                    )}
                    <button
                      onClick={() => remove(a.id)}
                      title="Excluir"
                      className="rounded-lg border border-ink-600 px-3 py-2 text-sm text-zinc-500 hover:bg-ink-700 hover:text-red-300"
                    >
                      🗑
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent = "text-white" }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-ink-600 bg-ink-900 p-4">
      <div className="text-xs uppercase tracking-wider text-zinc-500">{label}</div>
      <div className={`font-display mt-1 text-2xl font-bold ${accent}`}>{value}</div>
    </div>
  );
}

/* ----------------------------- SERVIÇOS ----------------------------- */

function ServicesTab() {
  const [rows, setRows] = useState<Service[]>([]);
  const [form, setForm] = useState({ name: "", description: "", price: "", duration: "30" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/services", { cache: "no-store" });
    const data = await res.json();
    setRows(data.services ?? []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        priceCents: Math.round(parseFloat(form.price.replace(",", ".")) * 100),
        durationMin: Number(form.duration),
      }),
    });
    setForm({ name: "", description: "", price: "", duration: "30" });
    setSaving(false);
    load();
  }

  async function patch(id: number, data: Partial<Service>) {
    await fetch("/api/admin/services", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="overflow-hidden rounded-xl border border-ink-600 bg-ink-900">
        <table className="w-full text-sm">
          <thead className="bg-ink-800 text-left text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3">Serviço</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3">Duração</th>
              <th className="px-4 py-3">Ativo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-700">
            {rows.map((s) => (
              <tr key={s.id} className={s.active ? "" : "opacity-50"}>
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{s.name}</div>
                  <div className="text-xs text-zinc-500">{s.description}</div>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={(s.priceCents / 100).toFixed(2)}
                    onBlur={(e) => {
                      const v = Math.round(parseFloat(e.target.value) * 100);
                      if (Number.isFinite(v) && v !== s.priceCents) patch(s.id, { priceCents: v });
                    }}
                    className="w-24 rounded border border-ink-600 bg-ink-800 px-2 py-1 text-white outline-none focus:border-gold-500"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    step="15"
                    min="15"
                    defaultValue={s.durationMin}
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (v >= 15 && v !== s.durationMin) patch(s.id, { durationMin: v });
                    }}
                    className="w-20 rounded border border-ink-600 bg-ink-800 px-2 py-1 text-white outline-none focus:border-gold-500"
                  />{" "}
                  <span className="text-zinc-500">min</span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => patch(s.id, { active: !s.active })}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                      s.active
                        ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/40"
                        : "bg-ink-800 text-zinc-400 ring-ink-600"
                    }`}
                  >
                    {s.active ? "Ativo" : "Inativo"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={create} className="h-fit rounded-xl border border-ink-600 bg-ink-900 p-5">
        <h3 className="mb-4 font-semibold text-white">Novo serviço</h3>
        <div className="space-y-3">
          <Input label="Nome" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Input
            label="Descrição"
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Preço (R$)"
              value={form.price}
              onChange={(v) => setForm({ ...form, price: v })}
              type="number"
              required
            />
            <Input
              label="Duração (min)"
              value={form.duration}
              onChange={(v) => setForm({ ...form, duration: v })}
              type="number"
              required
            />
          </div>
        </div>
        <button
          disabled={saving}
          className="mt-4 w-full rounded-lg bg-gold-500 py-2.5 font-semibold text-ink-950 hover:bg-gold-400 disabled:opacity-40"
        >
          {saving ? "Salvando…" : "Adicionar"}
        </button>
      </form>
    </div>
  );
}

/* ----------------------------- BARBEIROS ----------------------------- */

function BarbersTab() {
  const [rows, setRows] = useState<Barber[]>([]);
  const [form, setForm] = useState({ name: "", specialty: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/barbers", { cache: "no-store" });
    const data = await res.json();
    setRows(data.barbers ?? []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/admin/barbers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", specialty: "" });
    setSaving(false);
    load();
  }

  async function toggle(b: Barber) {
    await fetch("/api/admin/barbers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: b.id, active: !b.active }),
    });
    load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="grid h-fit gap-3 sm:grid-cols-2">
        {rows.map((b) => (
          <div
            key={b.id}
            className={`flex items-center gap-4 rounded-xl border border-ink-600 bg-ink-900 p-4 ${
              b.active ? "" : "opacity-50"
            }`}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 font-bold text-ink-950">
              {b.name
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-white">{b.name}</div>
              <div className="text-xs text-zinc-500">{b.specialty}</div>
            </div>
            <button
              onClick={() => toggle(b)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                b.active
                  ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/40"
                  : "bg-ink-800 text-zinc-400 ring-ink-600"
              }`}
            >
              {b.active ? "Ativo" : "Inativo"}
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={create} className="h-fit rounded-xl border border-ink-600 bg-ink-900 p-5">
        <h3 className="mb-4 font-semibold text-white">Novo barbeiro</h3>
        <div className="space-y-3">
          <Input label="Nome" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Input
            label="Especialidade"
            value={form.specialty}
            onChange={(v) => setForm({ ...form, specialty: v })}
          />
        </div>
        <button
          disabled={saving}
          className="mt-4 w-full rounded-lg bg-gold-500 py-2.5 font-semibold text-ink-950 hover:bg-gold-400 disabled:opacity-40"
        >
          {saving ? "Salvando…" : "Adicionar"}
        </button>
      </form>
    </div>
  );
}

/* ----------------------------- CONFIG ----------------------------- */

function SettingsTab() {
  const [cfg, setCfg] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setCfg(d.settings ?? {}));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cfg),
    });
    const data = await res.json();
    if (!res.ok) setMsg(data.error ?? "Erro ao salvar");
    else {
      setCfg(data.settings);
      setMsg("Configurações salvas!");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={save} className="max-w-xl rounded-xl border border-ink-600 bg-ink-900 p-6">
      <h3 className="mb-1 font-semibold text-white">Dados da barbearia</h3>
      <p className="mb-5 text-sm text-zinc-500">
        O número de WhatsApp é usado para o cliente confirmar o agendamento.
      </p>
      <div className="space-y-4">
        <Input
          label="Nome da barbearia"
          value={cfg.shop_name ?? ""}
          onChange={(v) => setCfg({ ...cfg, shop_name: v })}
        />
        <Input
          label="WhatsApp da barbearia (somente números, com 55 e DDD)"
          value={cfg.shop_whatsapp ?? ""}
          onChange={(v) => setCfg({ ...cfg, shop_whatsapp: v })}
          placeholder="5511999999999"
        />
        <Input
          label="Endereço"
          value={cfg.shop_address ?? ""}
          onChange={(v) => setCfg({ ...cfg, shop_address: v })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Abre às (hora)"
            type="number"
            value={cfg.open_hour ?? ""}
            onChange={(v) => setCfg({ ...cfg, open_hour: v })}
          />
          <Input
            label="Fecha às (hora)"
            type="number"
            value={cfg.close_hour ?? ""}
            onChange={(v) => setCfg({ ...cfg, close_hour: v })}
          />
        </div>
      </div>
      {msg && <p className="mt-4 text-sm text-emerald-300">{msg}</p>}
      <button
        disabled={saving}
        className="mt-5 rounded-lg bg-gold-500 px-6 py-2.5 font-semibold text-ink-950 hover:bg-gold-400 disabled:opacity-40"
      >
        {saving ? "Salvando…" : "Salvar"}
      </button>
    </form>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wider text-zinc-500">{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        step={type === "number" ? "any" : undefined}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-gold-500"
      />
    </div>
  );
}
