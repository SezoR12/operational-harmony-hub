import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const SESSION_COOKIE = "ai-eos-session";
const SESSION_EXPIRY_DAYS = 7;

export type SessionRole = "admin" | "data-entry" | null;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getSession(): Promise<SessionRole> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (!session) return null;

  try {
    const data = JSON.parse(session.value);
    if (data.expiresAt && new Date(data.expiresAt) > new Date()) {
      return data.role as SessionRole;
    }
  } catch {
    // invalid session
  }
  return null;
}

export async function setSession(role: "admin" | "data-entry"): Promise<void> {
  const cookieStore = await cookies();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  cookieStore.set(SESSION_COOKIE, JSON.stringify({ role, expiresAt: expiresAt.toISOString() }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function loginAsAdmin(password: string): Promise<boolean> {
  const config = await prisma.appConfig.findFirst();
  if (!config) return false;
  return verifyPassword(password, config.adminPasswordHash);
}

export async function loginAsDataEntry(password: string): Promise<boolean> {
  const config = await prisma.appConfig.findFirst();
  if (!config?.dataEntryPasswordHash) return false;
  return verifyPassword(password, config.dataEntryPasswordHash);
}

export async function initializeApp(
  adminPassword: string,
  dataEntryPassword?: string,
): Promise<void> {
  const existing = await prisma.appConfig.findFirst();
  if (existing) return;

  const adminHash = await hashPassword(adminPassword);
  const dataEntryHash = dataEntryPassword ? await hashPassword(dataEntryPassword) : null;

  // Generate random token for GM report
  const { v4: uuidv4 } = await import("uuid");
  const gmReportToken = uuidv4().replace(/-/g, "");

  await prisma.appConfig.create({
    data: {
      id: "singleton",
      adminPasswordHash: adminHash,
      dataEntryPasswordHash: dataEntryHash,
      gmReportToken,
    },
  });
}
