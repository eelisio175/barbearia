import Link from "next/link";
import { db } from "@/db";
import { barbers, services } from "@/db/schema";
import { ensureSeeded, getSettingsMap } from "@/lib/seed";
import { asc, eq } from "drizzle-orm";
import BookingForm, { WhatsIcon } from "@/components/BookingForm";
import { buildWhatsAppLink, formatPrice } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureSeeded();
  const [svc, brb, cfg] = await Promise.all([
    db.select().from(services).where(eq(services.active, true)).orderBy(asc(services.id)),
    db.select().from(barbers).where(eq(barbers.active, true)).orderBy(asc(barbers.id)),
    getSettingsMap(),
  ]);

  const shopName = cfg.shop_name ?? "Barbearia";
  const contactLink = buildWhatsAppLink(
    cfg.shop_whatsapp ?? "",
    `Olá, ${shopName}! Gostaria de mais informações.`,
  );

  return (
    <main>
      {/* Navbar */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/5 bg-ink-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="stripes h-8 w-2 rounded-full" />
            <span className="font-display text-lg font-bold tracking-wide text-white">
              {shopName}
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
            <a href="#servicos" className="hover:text-gold-400">
              Serviços
            </a>
            <a href="#equipe" className="hover:text-gold-400">
              Equipe
            </a>
            <a href="#contato" className="hover:text-gold-400">
              Contato
            </a>
            <Link href="/admin" className="hover:text-gold-400">
              Painel
            </Link>
          </nav>
          <a
            href="#agendar"
            className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-ink-950 transition hover:bg-gold-400"
          >
            Agendar
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[92vh] items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/hero.jpg)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/85 to-ink-950/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-ink-950/40" />
        <div className="relative mx-auto w-full max-w-6xl px-5 pt-28 pb-16">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">
            💈 Desde 2015 · Tradição & Estilo
          </p>
          <h1 className="font-display max-w-2xl text-5xl font-bold leading-[1.05] text-white sm:text-6xl lg:text-7xl">
            Corte afiado. <br />
            <span className="bg-gradient-to-r from-gold-300 via-gold-400 to-gold-600 bg-clip-text text-transparent">
              Atitude impecável.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-zinc-300">
            Agende online em menos de um minuto, escolha seu barbeiro favorito e confirme
            direto pelo WhatsApp. Sem fila, sem espera.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#agendar"
              className="rounded-xl bg-gold-500 px-7 py-4 text-base font-bold text-ink-950 shadow-lg shadow-gold-600/20 transition hover:bg-gold-400"
            >
              Agendar horário
            </a>
            <a
              href={contactLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-7 py-4 text-base font-semibold text-white backdrop-blur transition hover:bg-white/10"
            >
              <WhatsIcon className="h-5 w-5 text-[#25D366]" />
              Falar no WhatsApp
            </a>
          </div>
          <div className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-8">
            {[
              ["+12k", "cortes feitos"],
              ["4.9★", "avaliação média"],
              [`${cfg.open_hour}h–${cfg.close_hour}h`, "seg a sáb"],
            ].map(([v, l]) => (
              <div key={l}>
                <div className="font-display text-2xl font-bold text-gold-400">{v}</div>
                <div className="text-xs uppercase tracking-wider text-zinc-500">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="servicos" className="mx-auto max-w-6xl px-5 py-20">
        <SectionTitle eyebrow="Serviços" title="Tabela de preços" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {svc.map((s) => (
            <div
              key={s.id}
              className="group relative overflow-hidden rounded-2xl border border-ink-600 bg-ink-900 p-6 transition hover:border-gold-500/50"
            >
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gold-500/5 transition group-hover:bg-gold-500/10" />
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-lg font-semibold text-white">{s.name}</h3>
                <span className="font-display text-xl font-bold text-gold-400">
                  {formatPrice(s.priceCents)}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-400">{s.description}</p>
              <p className="mt-4 text-xs uppercase tracking-wider text-zinc-500">
                ⏱ {s.durationMin} minutos
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section id="equipe" className="border-y border-white/5 bg-ink-900/50 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <SectionTitle eyebrow="Equipe" title="Nossos barbeiros" />
          <div className="grid gap-4 sm:grid-cols-3">
            {brb.map((b) => (
              <div
                key={b.id}
                className="rounded-2xl border border-ink-600 bg-ink-900 p-6 text-center"
              >
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 font-display text-2xl font-bold text-ink-950 ring-4 ring-ink-800">
                  {b.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <h3 className="text-lg font-semibold text-white">{b.name}</h3>
                <p className="mt-1 text-sm text-zinc-400">{b.specialty}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking */}
      <section id="agendar" className="mx-auto max-w-4xl px-5 py-20">
        <SectionTitle
          eyebrow="Agendamento online"
          title="Reserve seu horário"
          subtitle="Escolha o serviço, o barbeiro e o melhor horário. Depois é só confirmar pelo WhatsApp."
        />
        <BookingForm services={svc} barbers={brb} shopName={shopName} />
      </section>

      {/* Contact / Footer */}
      <footer id="contato" className="border-t border-white/5 bg-ink-900/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <span className="stripes h-8 w-2 rounded-full" />
              <span className="font-display text-lg font-bold text-white">{shopName}</span>
            </div>
            <p className="mt-3 text-sm text-zinc-400">
              Cortes clássicos e modernos, barba na navalha e atendimento de primeira.
            </p>
          </div>
          <div className="text-sm text-zinc-400">
            <h4 className="mb-3 font-semibold uppercase tracking-wider text-zinc-200">Horário</h4>
            <p>Segunda a Sábado</p>
            <p className="text-gold-400">
              {cfg.open_hour}h às {cfg.close_hour}h
            </p>
            <p className="mt-2">Domingo: fechado</p>
          </div>
          <div className="text-sm text-zinc-400">
            <h4 className="mb-3 font-semibold uppercase tracking-wider text-zinc-200">Contato</h4>
            <p>📍 {cfg.shop_address}</p>
            <a
              href={contactLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 text-[#25D366] hover:underline"
            >
              <WhatsIcon className="h-4 w-4" /> WhatsApp
            </a>
          </div>
        </div>
        <div className="border-t border-white/5 py-5 text-center text-xs text-zinc-600">
          © {new Date().getFullYear()} {shopName}. Todos os direitos reservados. ·{" "}
          <Link href="/admin" className="hover:text-zinc-400">
            Área administrativa
          </Link>
        </div>
      </footer>

      {/* Floating WhatsApp */}
      <a
        href={contactLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-ink-950 shadow-xl shadow-emerald-900/40 transition hover:scale-105"
      >
        <WhatsIcon className="h-8 w-8" />
      </a>
    </main>
  );
}

function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-10 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-400">{eyebrow}</p>
      <h2 className="font-display mt-2 text-3xl font-bold text-white sm:text-4xl">{title}</h2>
      {subtitle && <p className="mx-auto mt-3 max-w-xl text-zinc-400">{subtitle}</p>}
      <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-gradient-to-r from-gold-400 to-gold-600" />
    </div>
  );
}
