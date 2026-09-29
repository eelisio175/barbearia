import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Navalha de Ouro | Barbearia",
  description:
    "Barbearia premium. Agende seu corte e barba online e confirme pelo WhatsApp.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-ink-950 text-zinc-100 antialiased">{children}</body>
    </html>
  );
}
