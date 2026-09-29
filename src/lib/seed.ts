import { db } from "@/db";
import { barbers, services, settings } from "@/db/schema";
import { count } from "drizzle-orm";

let seeded = false;

export async function ensureSeeded() {
  if (seeded) return;
  const [{ value: serviceCount }] = await db
    .select({ value: count() })
    .from(services);

  if (Number(serviceCount) === 0) {
    await db.insert(services).values([
      {
        name: "Corte Clássico",
        description: "Corte tradicional na tesoura e máquina, com acabamento na navalha.",
        priceCents: 4500,
        durationMin: 30,
      },
      {
        name: "Barba Completa",
        description: "Modelagem, toalha quente, navalha e hidratação.",
        priceCents: 3500,
        durationMin: 30,
      },
      {
        name: "Corte + Barba",
        description: "O combo completo para sair renovado.",
        priceCents: 7000,
        durationMin: 60,
      },
      {
        name: "Degradê / Fade",
        description: "Fade preciso com acabamento detalhado.",
        priceCents: 5500,
        durationMin: 45,
      },
      {
        name: "Sobrancelha",
        description: "Alinhamento e limpeza na navalha.",
        priceCents: 1500,
        durationMin: 15,
      },
    ]);
  }

  const [{ value: barberCount }] = await db
    .select({ value: count() })
    .from(barbers);

  if (Number(barberCount) === 0) {
    await db.insert(barbers).values([
      { name: "Rafael Souza", specialty: "Especialista em fade e navalha" },
      { name: "Diego Martins", specialty: "Cortes clássicos e barba" },
      { name: "Lucas Ferreira", specialty: "Visagismo e cortes modernos" },
    ]);
  }

  await db
    .insert(settings)
    .values([
      { key: "shop_name", value: "Barbearia Navalha de Ouro" },
      { key: "shop_whatsapp", value: "5511999999999" },
      { key: "shop_address", value: "Rua das Tesouras, 123 - Centro" },
      { key: "open_hour", value: "9" },
      { key: "close_hour", value: "19" },
    ])
    .onConflictDoNothing();

  seeded = true;
}

export async function getSettingsMap() {
  await ensureSeeded();
  const rows = await db.select().from(settings);
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return map;
}
