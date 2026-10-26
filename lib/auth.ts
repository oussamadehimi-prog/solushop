import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { isAdminRole, isClientRole } from "@/lib/roles";

export const SESSION_COOKIE = "shop_session";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV !== "production") return "dev-secret-change-me";
  throw new Error("JWT_SECRET must be configured in production.");
}

export function signSession(user: SessionUser) {
  return jwt.sign(user, getJwtSecret(), {
    expiresIn: "7d",
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  try {
    const payload = jwt.verify(token, getJwtSecret()) as SessionUser;
    return payload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSessionUser();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      addresses: true,
    },
  });

  if (!user || (!isAdminRole(user.role) && !isClientRole(user.role))) {
    return null;
  }

  return user;
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
  if (!isAdminRole(user.role)) {
    throw new Error("Forbidden");
  }
  return user;
}

export async function getAdminSession() {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return null;
  }
  return user;
}
