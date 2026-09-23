import type { Request } from "express";
import { sessionCookieName, verifySessionToken } from "./session";
import { prisma } from "./prisma";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  locale: string;
  savedTags: string[]
}

export async function getRequestUser(req: Request): Promise<AuthUser | null> {
  const token = req.cookies[sessionCookieName] as string | undefined;
  const session = verifySessionToken(token);

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    initials: user.initials,
    locale: user.locale,
    savedTags: user.savedTags,
  };
}
