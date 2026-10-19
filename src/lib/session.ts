import { env } from "../config/env";
import jwt from "jsonwebtoken";

export const sessionCookieName = "bug_note_session";
export const sessionMaxAgeSeconds = 60 * 60 * 24 * 7;

type SessionPayload = {
  userId: string;
  purpose: "session";
};

export function createSessionToken(userId: string) {
  return jwt.sign({ userId, purpose: "session" }, env.sessionSecret, {
    expiresIn: sessionMaxAgeSeconds,
  });
}

export function verifySessionToken(token?: string) {
  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, env.sessionSecret) as SessionPayload;
    if (payload.purpose !== "session") {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
