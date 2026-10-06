import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "shop_session";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export function signSession(user: SessionUser) {
  return jwt.sign(user, process.env.JWT_SECRET || "dev-secret-change-me", {
    expiresIn: "7d",
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret-change-me") as SessionUser;
    return payload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSessionUser();
  if (!session) return null;

  return prisma.user.findUnique({
    where: { id: session.id },
    include: {
      addresses: true,
    },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new Error("Forbidden");
  }
  return user;
}

export async function getAdminSession() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    return null;
  }
  return user;
}
