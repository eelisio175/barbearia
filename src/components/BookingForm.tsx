"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDateBR, formatPrice } from "@/lib/whatsapp";

type Service = {
  id: number;
  name: string;
  description: string | null;
  priceCents: number;
  durationMin: number;
};
type Barber = { id: number; name: string; specialty: string | null };
type Slot = { time: string; available: boolean };

type Props = {
  services: Service[];
  barbers: Barber[];
  shopName: string;
};

type Created = {
  id: number;
  customerName: string;
  date: string;
  time: string;
  serviceName: string;
  barberName: string;
  priceCents: number;
};

function localToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export default function BookingForm({ services, barbers, shopName }: Props) {
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [barberId, setBarberId] = useState<number | null>(null);
  const [date, setDate] = useState(localToday());
  const [time, setTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [closed, setClosed] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);

  const service = useMemo(() => services.find((s) => s.id === serviceId), [services, serviceId]);
  const barber = useMemo(() => barbers.find((b) => b.id === barberId), [barbers, barberId]);

  const loadSlots = useCallback(async () => {
    if (!serviceId || !barberId || !date) return;
    setLoadingSlots(true);
    setTime(null);
    try {
      const res = await fetch(
        `/api/availability?date=${date}&barberId=${barberId}&serviceId=${serviceId}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      setSlots(data.slots ?? []);
      setClosed(Boolean(data.closed));
    } finally {
      setLoadingSlots(false);
    }
  }, [serviceId, barberId, date]);

  useEffect(() => {
    if (step === 3) loadSlots();
  }, [step, loadSlots]);

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          serviceId,
          barberId,
          date,
          time,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao agendar.");
        if (res.status === 409) {
          setStep(3);
          loadSlots();
        }
        return;
      }
      setCreated(data.appointment);
      setWhatsappLink(data.whatsappLink);
      setStep(5);
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep(1);
    setServiceId(null);
    setBarberId(null);
    setDate(localToday());
    setTime(null);
    setName("");
    setPhone("");
    setNotes("");
    setCreated(null);
    setWhatsappLink(null);
    setError(null);
  }

  const steps = ["Serviço", "Barbeiro", "Data e hora", "Seus dados"];

  return (
    <div className="rounded-2xl border border-ink-600 bg-ink-900/80 p-6 shadow-2xl shadow-black/50 backdrop-blur sm:p-8">
      {/* Stepper */}
      {step <= 4 && (
        <ol className="mb-8 grid grid-cols-4 gap-2">
          {steps.map((label, i) => {
            const n = i + 1;
            const active = n === step;
            const done = n < step;
            return (
              <li key={label} className="flex flex-col items-center gap-2 text-center">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition ${
                    active
                      ? "bg-gold-500 text-ink-950"
                      : done
                        ? "bg-gold-500/20 text-gold-400 ring-1 ring-gold-500/50"
                        : "bg-ink-700 text-zinc-500"
                  }`}
                >
                  {done ? "✓" : n}
                </span>
                <span
                  className={`text-[11px] uppercase tracking-wider sm:text-xs ${
                    active ? "text-gold-400" : "text-zinc-500"
                  }`}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {/* Step 1: Service */}
      {step === 1 && (
        <div className="fade-up">
          <h3 className="mb-4 text-xl font-semibold text-white">Escolha o serviço</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {services.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setServiceId(s.id)}
                className={`group rounded-xl border p-4 text-left transition ${
                  serviceId === s.id
                    ? "border-gold-500 bg-gold-500/10"
                    : "border-ink-600 bg-ink-800 hover:border-zinc-500"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-semibold text-white">{s.name}</span>
                  <span className="shrink-0 font-bold text-gold-400">{formatPrice(s.priceCents)}</span>
                </div>
                {s.description && (
                  <p className="mt-1 text-sm text-zinc-400">{s.description}</p>
                )}
                <p className="mt-2 text-xs uppercase tracking-wider text-zinc-500">
                  ⏱ {s.durationMin} min
                </p>
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              disabled={!serviceId}
              onClick={() => setStep(2)}
              className="rounded-lg bg-gold-500 px-6 py-3 font-semibold text-ink-950 transition hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Barber */}
      {step === 2 && (
        <div className="fade-up">
          <h3 className="mb-4 text-xl font-semibold text-white">Escolha o barbeiro</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {barbers.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBarberId(b.id)}
                className={`rounded-xl border p-4 text-left transition ${
                  barberId === b.id
                    ? "border-gold-500 bg-gold-500/10"
                    : "border-ink-600 bg-ink-800 hover:border-zinc-500"
                }`}
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-lg font-bold text-ink-950">
                  {b.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="font-semibold text-white">{b.name}</div>
                {b.specialty && <p className="mt-1 text-sm text-zinc-400">{b.specialty}</p>}
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-lg border border-ink-600 px-5 py-3 text-zinc-300 transition hover:bg-ink-700"
            >
              ← Voltar
            </button>
            <button
              type="button"
              disabled={!barberId}
              onClick={() => setStep(3)}
              className="rounded-lg bg-gold-500 px-6 py-3 font-semibold text-ink-950 transition hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Date & time */}
      {step === 3 && (
        <div className="fade-up">
          <h3 className="mb-4 text-xl font-semibold text-white">Data e horário</h3>
          <label className="mb-2 block text-sm text-zinc-400">Data</label>
          <input
            type="date"
            value={date}
            min={localToday()}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-ink-600 bg-ink-800 px-4 py-3 text-white outline-none focus:border-gold-500 sm:w-64"
          />

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-zinc-400">Horários disponíveis</span>
              {loadingSlots && <span className="text-xs text-zinc-500">carregando…</span>}
            </div>
            {closed ? (
              <p className="rounded-lg border border-ink-600 bg-ink-800 p-4 text-sm text-zinc-400">
                Não abrimos aos domingos. Escolha outra data.
              </p>
            ) : slots.length === 0 && !loadingSlots ? (
              <p className="rounded-lg border border-ink-600 bg-ink-800 p-4 text-sm text-zinc-400">
                Nenhum horário para esta data.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {slots.map((s) => (
                  <button
                    key={s.time}
                    type="button"
                    disabled={!s.available}
                    onClick={() => setTime(s.time)}
                    className={`rounded-lg border py-2 text-sm font-medium transition ${
                      time === s.time
                        ? "border-gold-500 bg-gold-500 text-ink-950"
                        : s.available
                          ? "border-ink-600 bg-ink-800 text-zinc-200 hover:border-gold-500/60"
                          : "cursor-not-allowed border-ink-700 bg-ink-900 text-zinc-600 line-through"
                    }`}
                  >
                    {s.time}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-lg border border-ink-600 px-5 py-3 text-zinc-300 transition hover:bg-ink-700"
            >
              ← Voltar
            </button>
            <button
              type="button"
              disabled={!time}
              onClick={() => setStep(4)}
              className="rounded-lg bg-gold-500 px-6 py-3 font-semibold text-ink-950 transition hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Details */}
      {step === 4 && (
        <div className="fade-up">
          <h3 className="mb-4 text-xl font-semibold text-white">Seus dados</h3>

          <div className="mb-6 rounded-xl border border-gold-500/30 bg-gold-500/5 p-4 text-sm">
            <p className="mb-1 text-xs uppercase tracking-wider text-gold-400">Resumo</p>
            <p className="text-zinc-200">
              <strong className="text-white">{service?.name}</strong> com{" "}
              <strong className="text-white">{barber?.name}</strong>
            </p>
            <p className="text-zinc-300">
              {formatDateBR(date)} às {time} · {service && formatPrice(service.priceCents)}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-zinc-400">Nome completo</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="w-full rounded-lg border border-ink-600 bg-ink-800 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-gold-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-400">WhatsApp (com DDD)</label>
              <input
                value={phone}
                inputMode="tel"
                onChange={(e) => setPhone(maskPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                className="w-full rounded-lg border border-ink-600 bg-ink-800 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-gold-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm text-zinc-400">Observações (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Ex.: prefiro máquina 2 nas laterais"
                className="w-full rounded-lg border border-ink-600 bg-ink-800 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-gold-500"
              />
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="rounded-lg border border-ink-600 px-5 py-3 text-zinc-300 transition hover:bg-ink-700"
            >
              ← Voltar
            </button>
            <button
              type="button"
              disabled={submitting || name.trim().length < 2 || phone.replace(/\D/g, "").length < 10}
              onClick={submit}
              className="rounded-lg bg-gold-500 px-6 py-3 font-semibold text-ink-950 transition hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Agendando…" : "Confirmar agendamento"}
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Success */}
      {step === 5 && created && (
        <div className="fade-up text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-3xl ring-1 ring-emerald-500/40">
            ✅
          </div>
          <h3 className="text-2xl font-bold text-white">Agendamento recebido!</h3>
          <p className="mt-2 text-zinc-400">
            Seu horário está <span className="text-gold-400">reservado</span>. Para confirmar,
            envie a mensagem pelo WhatsApp da {shopName}.
          </p>

          <div className="mx-auto mt-6 max-w-md rounded-xl border border-ink-600 bg-ink-800 p-5 text-left text-sm">
            <p className="mb-2 text-xs uppercase tracking-wider text-zinc-500">
              Agendamento #{created.id}
            </p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              <dt className="text-zinc-500">Cliente</dt>
              <dd className="text-white">{created.customerName}</dd>
              <dt className="text-zinc-500">Serviço</dt>
              <dd className="text-white">{created.serviceName}</dd>
              <dt className="text-zinc-500">Barbeiro</dt>
              <dd className="text-white">{created.barberName}</dd>
              <dt className="text-zinc-500">Quando</dt>
              <dd className="text-white">
                {formatDateBR(created.date)} às {created.time}
              </dd>
              <dt className="text-zinc-500">Valor</dt>
              <dd className="font-semibold text-gold-400">{formatPrice(created.priceCents)}</dd>
            </dl>
          </div>

          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-3 rounded-xl bg-[#25D366] px-7 py-4 text-lg font-bold text-ink-950 shadow-lg shadow-emerald-900/40 transition hover:bg-[#1ebe5a]"
            >
              <WhatsIcon />
              Confirmar pelo WhatsApp
            </a>
          )}

          <div className="mt-6">
            <button
              type="button"
              onClick={reset}
              className="text-sm text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline"
            >
              Fazer outro agendamento
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function WhatsIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden>
      <path d="M16 3C9.4 3 4 8.3 4 14.9c0 2.4.7 4.7 2 6.7L4 29l7.6-2c1.9 1 3.9 1.5 6 1.5h.4c6.6 0 12-5.3 12-11.9S22.6 3 16 3zm0 22c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-4 1.1 1.1-3.9-.3-.4c-1.1-1.7-1.7-3.7-1.7-5.7C5.4 9.5 10.2 5 16 5s10.6 4.5 10.6 10-4.8 10-10.6 10zm5.8-7.4c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.5-1.6-.9-.8-1.6-1.9-1.7-2.2-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5.1-.2.1-.4 0-.6-.1-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.7s1.2 3.2 1.4 3.4c.2.2 2.4 3.6 5.7 5 .8.3 1.4.5 1.9.7.8.3 1.5.2 2.1.1.6-.1 1.9-.8 2.2-1.6.3-.8.3-1.4.2-1.6-.1-.1-.3-.2-.6-.4z" />
    </svg>
  );
}
