import type { Request, Response } from "express";
import {
  deleteCurrentUser,
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPassword,
  updateCurrentUser,
} from "./auth.service";
import {
  createSessionToken,
  sessionCookieName,
  sessionMaxAgeSeconds,
} from "../../lib/session";
import { getAuthenticatedUser } from "../../lib/auth";

function setSessionCookie(res: Response, userId: string) {
  const token = createSessionToken(userId);

  res.cookie(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: sessionMaxAgeSeconds * 1000,
  });
}

function clearSessionCookie(res: Response) {
  res.clearCookie(sessionCookieName, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function registerController(req: Request, res: Response) {
  const body = req.body as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!body.name || !body.email || !body.password) {
    return res
      .status(400)
      .json({ message: "Name, email and password are required" });
  }

  if (body.password.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters" });
  }

  const result = await registerUser({
    name: body.name,
    email: body.email,
    password: body.password,
  });

  if ("error" in result) {
    return res.status(400).json({ message: result.error });
  }

  setSessionCookie(res, result.user.id);

  return res.status(201).json({ user: result.user });
}

export async function loginController(req: Request, res: Response) {
  const body = req.body as {
    email?: string;
    password?: string;
  };

  if (!body.email || !body.password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  const result = await loginUser({
    email: body.email,
    password: body.password,
  });

  if ("error" in result) {
    return res.status(401).json({
      message: result.error,
    });
  }

  setSessionCookie(res, result.user.id);

  return res.json({
    user: result.user,
  });
}


export async function forgotPasswordController(req: Request, res: Response) {
  const body = req.body as { email?: string };

  if (!body.email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const result = await requestPasswordReset(body.email);

  return res.json(result);
}

export async function resetPasswordController(req: Request, res: Response) {
  const body = req.body as { token?: string; password?: string };

  if (!body.token || !body.password) {
    return res.status(400).json({
      message: "Reset token and password are required",
    });
  }

  const result = await resetPassword({
    token: body.token,
    password: body.password,
  });

  if ("error" in result) {
    return res.status(result.status ?? 400).json({ message: result.error });
  }

  return res.json({ ok: true });
}

export async function meController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);

  return res.json({
    user,
  });
}

export async function updateMeController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);

  const result = await updateCurrentUser(user.id, req.body);

  if ("error" in result) {
    return res.status(result.status ?? 400).json({ message: result.error });
  }

  return res.json({ user: result.user });
}

export async function deleteMeController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const body = req.body as { currentPassword?: string };

  if (!body.currentPassword) {
    return res.status(400).json({ message: "Current password is required" });
  }

  const result = await deleteCurrentUser(user.id, body.currentPassword);

  if ("error" in result) {
    return res.status(result.status ?? 400).json({ message: result.error });
  }

  clearSessionCookie(res);

  return res.json({ ok: true });
}

export async function logoutController(_req: Request, res: Response) {
  clearSessionCookie(res);

  return res.json({
    ok: true,
  });
}
