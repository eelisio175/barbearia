export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

/** Normaliza um telefone brasileiro para o formato internacional (55 + DDD + número). */
export function normalizePhone(value: string) {
  let digits = onlyDigits(value);
  if (digits.startsWith("0")) digits = digits.replace(/^0+/, "");
  if (digits.length === 10 || digits.length === 11) digits = "55" + digits;
  return digits;
}

export function buildWhatsAppLink(phone: string, message: string) {
  const number = normalizePhone(phone);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function formatDateBR(isoDate: string) {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

export function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

type AppointmentInfo = {
  id: number;
  customerName: string;
  serviceName: string;
  barberName: string;
  date: string;
  time: string;
  priceCents: number;
  shopName: string;
};

/** Mensagem enviada pelo CLIENTE para a barbearia solicitando confirmação. */
export function customerMessage(a: AppointmentInfo) {
  return [
    `Olá, ${a.shopName}! 👋`,
    `Acabei de fazer um agendamento pelo site e gostaria de confirmar:`,
    ``,
    `📋 Agendamento #${a.id}`,
    `👤 Nome: ${a.customerName}`,
    `✂️ Serviço: ${a.serviceName}`,
    `💈 Barbeiro: ${a.barberName}`,
    `📅 Data: ${formatDateBR(a.date)}`,
    `⏰ Horário: ${a.time}`,
    `💰 Valor: ${formatPrice(a.priceCents)}`,
    ``,
    `Podem confirmar, por favor?`,
  ].join("\n");
}

/** Mensagem enviada pela BARBEARIA para o cliente confirmando o horário. */
export function shopConfirmationMessage(a: AppointmentInfo) {
  return [
    `Olá, ${a.customerName}! 👋`,
    `Aqui é da ${a.shopName}. Seu agendamento está *CONFIRMADO* ✅`,
    ``,
    `✂️ Serviço: ${a.serviceName}`,
    `💈 Barbeiro: ${a.barberName}`,
    `📅 Data: ${formatDateBR(a.date)}`,
    `⏰ Horário: ${a.time}`,
    `💰 Valor: ${formatPrice(a.priceCents)}`,
    ``,
    `Chegue com 5 minutinhos de antecedência. Até lá! 💈`,
  ].join("\n");
}

/** Mensagem de cancelamento enviada pela barbearia. */
export function shopCancelMessage(a: AppointmentInfo) {
  return [
    `Olá, ${a.customerName}.`,
    `Infelizmente precisamos cancelar seu agendamento na ${a.shopName} do dia ${formatDateBR(a.date)} às ${a.time} (${a.serviceName}).`,
    `Podemos remarcar para outro horário? Responda aqui e a gente encaixa você. 🙏`,
  ].join("\n");
}
