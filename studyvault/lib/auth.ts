import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "studyvault_session";
const SESSION_SECONDS = 60 * 60 * 24 * 14;

type Role = "reader" | "admin";

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET musí mít alespoň 32 znaků.");
  }
  return value;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function verifyPassword(password: string): Role | null {
  const admin = process.env.ADMIN_PASSWORD;
  const user = process.env.USER_PASSWORD;

  if (!admin || !user) {
    throw new Error("Chybí USER_PASSWORD nebo ADMIN_PASSWORD.");
  }

  if (safeEqual(password, admin)) return "admin";
  if (safeEqual(password, user)) return "reader";
  return null;
}

export function createSession(role: Role) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `${role}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function readSession(token?: string): { role: Role } | null {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [role, expires, signature] = parts;
  if (role !== "admin" && role !== "reader") return null;

  const expiresAt = Number(expires);
  if (!Number.isFinite(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return null;

  const payload = `${role}.${expires}`;
  if (!safeEqual(signature, sign(payload))) return null;

  return { role };
}

export async function getSession() {
  const store = await cookies();
  return readSession(store.get(COOKIE_NAME)?.value);
}

export async function setSession(role: Role) {
  const store = await cookies();
  store.set(COOKIE_NAME, createSession(role), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_SECONDS
  });
}

export async function clearSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0
  });
}

export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.role !== "admin") throw new Error("FORBIDDEN");
  return session;
}
