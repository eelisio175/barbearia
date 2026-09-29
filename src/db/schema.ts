import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  date,
} from "drizzle-orm/pg-core";

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  priceCents: integer("price_cents").notNull(),
  durationMin: integer("duration_min").notNull().default(30),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const barbers = pgTable("barbers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  specialty: varchar("specialty", { length: 160 }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  customerName: varchar("customer_name", { length: 120 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 30 }).notNull(),
  serviceId: integer("service_id")
    .notNull()
    .references(() => services.id),
  barberId: integer("barber_id")
    .notNull()
    .references(() => barbers.id),
  date: date("date").notNull(),
  time: varchar("time", { length: 5 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: varchar("key", { length: 60 }).primaryKey(),
  value: text("value").notNull(),
});

export type Service = typeof services.$inferSelect;
export type Barber = typeof barbers.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
