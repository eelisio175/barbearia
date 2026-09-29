import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "barber_admin";

function getPassword() {
  return process.env.ADMIN_PASSWORD || "admin123";
}

function getSecret() {
  return process.env.ADMIN_SECRET || "barbearia-secret-key-change-me";
}

export function makeToken() {
  const payload = "admin";
  const sig = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyToken(token: string | undefined) {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = createHmac("sha256", getSecret()).update(payload).digest("hex");
  if (expected.length !== sig.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}

export function checkPassword(password: string) {
  const expected = getPassword();
  if (expected.length !== password.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(password));
}

export async function isAdmin() {
  const store = await cookies();
  return verifyToken(store.get(COOKIE_NAME)?.value);
}

export async function setAdminCookie() {
  const store = await cookies();
  store.set(COOKIE_NAME, makeToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
