import { env } from "../config/env";
import jwt from "jsonwebtoken";

export const sessionCookieName = "bug_note_session";
export const sessionMaxAgeSeconds = 60 * 60 * 24 * 7;

type SessionPayload = {
  userId: string;
};

export function createSessionToken(userId: string) {
  return jwt.sign({ userId }, env.sessionSecret, {
    expiresIn: sessionMaxAgeSeconds,
  });
}

export function verifySessionToken(token?: string) {
  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, env.sessionSecret) as SessionPayload;
  } catch {
    return null;
  }
}
