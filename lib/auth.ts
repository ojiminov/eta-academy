import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET environment variable is not set");
}
const secret = new TextEncoder().encode(jwtSecret || "dev_fallback_not_for_production");

export interface SessionPayload {
  userId: string;
  role: string;
  email: string;
  [key: string]: unknown;
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set("eta_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return token;
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("eta_session")?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("eta_session");
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        teacher: true,
        student: true,
        parent: { include: { children: { include: { student: { include: { user: true } } } } } },
      },
    });
    return user;
  } catch {
    // Graceful fallback if DB schema is mid-migration — return basic user info only
    try {
      return await prisma.user.findUnique({
        where: { id: session.userId },
        include: { teacher: true, student: true },
      });
    } catch {
      return null;
    }
  }
}
