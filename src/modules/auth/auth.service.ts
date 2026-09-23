import jwt from "jsonwebtoken";

import { env } from "../../config/env";
import { verifyPassword, hashPassword } from "../../lib/password";
import { prisma } from "../../lib/prisma";

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type PasswordResetPayload = {
  purpose: "password-reset";
  userId: string;
};

type UpdateCurrentUserInput = {
  name?: string;
  email?: string;
  role?: string;
  currentPassword?: string;
  newPassword?: string;
  savedTags?: string[];
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function toAuthUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  locale: string;
  savedTags: string[];
}) {
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


function createPasswordResetToken(userId: string) {
  return jwt.sign(
    { purpose: "password-reset", userId },
    env.sessionSecret,
    { expiresIn: "15m" },
  );
}

function verifyPasswordResetToken(token: string) {
  try {
    const payload = jwt.verify(token, env.sessionSecret) as PasswordResetPayload;

    if (payload.purpose !== "password-reset") {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function normalizeSavedTags(tags: string[]) {
  return [
    ...new Set(
      tags
        .map((tag) => tag.trim().replace(/^#/, ""))
        .filter(Boolean),
    ),
  ];
}

export async function registerUser(input: RegisterInput) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return {
      error: "Email is already registered",
    };
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      initials: getInitials(name || email),
      passwordHash,
    },
  });

  return {
    user: toAuthUser(user),
  };
}

export async function loginUser(input: LoginInput) {
  const email = input.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return {
      error: "Invalid email or password",
    };
  }

  const isPasswordValid = await verifyPassword(
    input.password,
    user.passwordHash,
  );

  if (!isPasswordValid) {
    return {
      error: "Invalid email or password",
    };
  }

  return {
    user: toAuthUser(user),
  };
}

export async function updateCurrentUser(
  userId: string,
  input: UpdateCurrentUserInput,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { error: "User not found", status: 404 };
  }

  const data: {
    name?: string;
    email?: string;
    role?: string;
    initials?: string;
    passwordHash?: string;
    savedTags?: string[];
  } = {};

  if (input.name !== undefined) {
    const name = input.name.trim();

    if (!name) {
      return { error: "Name is required", status: 400 };
    }

    data.name = name;
    data.initials = getInitials(name);
  }

  if (input.role !== undefined) {
    data.role = input.role.trim() || "Developer";
  }

  if (input.savedTags !== undefined) {
    data.savedTags = normalizeSavedTags(input.savedTags);
  }

  const nextEmail = input.email?.trim().toLowerCase();
  const wantsEmailChange = Boolean(nextEmail && nextEmail !== user.email);
  const wantsPasswordChange = Boolean(input.newPassword);

  if (wantsEmailChange || wantsPasswordChange) {
    if (!input.currentPassword) {
      return { error: "Current password is required", status: 400 };
    }

    const isCurrentPasswordValid = await verifyPassword(
      input.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      return { error: "Current password is incorrect", status: 401 };
    }
  }

  if (wantsEmailChange && nextEmail) {
    const existingUser = await prisma.user.findUnique({
      where: { email: nextEmail },
    });

    if (existingUser && existingUser.id !== user.id) {
      return { error: "Email is already registered", status: 400 };
    }

    data.email = nextEmail;
  }

  if (wantsPasswordChange && input.newPassword) {
    if (input.newPassword.length < 8) {
      return {
        error: "New password must be at least 8 characters",
        status: 400,
      };
    }

    data.passwordHash = await hashPassword(input.newPassword);
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data,
  });

  return {
    user: toAuthUser(updatedUser),
  };
}

export async function deleteCurrentUser(userId: string, currentPassword: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { error: "User not found", status: 404 };
  }

  const isCurrentPasswordValid = await verifyPassword(
    currentPassword,
    user.passwordHash,
  );

  if (!isCurrentPasswordValid) {
    return { error: "Current password is incorrect", status: 401 };
  }

  await prisma.user.delete({
    where: { id: user.id },
  });

  return { ok: true };
}

export async function requestPasswordReset(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return { resetUrl: null };
  }

  const token = createPasswordResetToken(user.id);
  const resetUrl = `${env.frontendUrl}/auth/reset-password?token=${token}`;

  return { resetUrl };
}

export async function resetPassword(input: { token: string; password: string }) {
  const payload = verifyPasswordResetToken(input.token);

  if (!payload) {
    return { error: "Reset link is invalid or expired", status: 400 };
  }

  if (input.password.length < 8) {
    return {
      error: "Password must be at least 8 characters",
      status: 400,
    };
  }

  const passwordHash = await hashPassword(input.password);

  await prisma.user.update({
    where: { id: payload.userId },
    data: { passwordHash },
  });

  return { ok: true };
}
