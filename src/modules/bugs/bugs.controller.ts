import type { Request, Response } from "express";
import { createBug, deleteBug, listBugs, updateBug } from "./bugs.service.js";
import { getAuthenticatedUser } from "../../lib/auth.js";

import { createBugSchema, updateBugSchema } from "./bugs.schemas.js";

export async function listBugsController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);

  const bugs = await listBugs(user.id);

  return res.json({
    bugs,
  });
}

export async function createBugController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);

  const parsed = createBugSchema.safeParse(req.body);

  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: parsed.error.issues[0]?.message ?? "Invalid input" });
  }

  const bug = await createBug(user.id, parsed.data);

  return res.status(201).json({ bug });
}

export async function updateBugController(
  req: Request<{ id: string }>,
  res: Response,
) {
  const user = getAuthenticatedUser(req);
  const bugId = req.params.id;

  if (!bugId) {
    return res.status(400).json({
      message: "Bug id is required.",
    });
  }

  const parsed = updateBugSchema.safeParse(req.body);

  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: parsed.error.issues[0]?.message ?? "Invalid input" });
  }

  const bug = await updateBug(user.id, bugId, parsed.data);

  if (!bug) {
    return res.status(404).json({
      message: "Bug not found.",
    });
  }

  return res.json({ bug });
}

export async function deleteBugController(
  req: Request<{ id: string }>,
  res: Response,
) {
  const user = getAuthenticatedUser(req);

  const bugId = req.params.id;

  if (!bugId) {
    return res.status(400).json({ message: "Bug id is required" });
  }

  const bug = await deleteBug(user.id, bugId);

  if (!bug) {
    return res.status(404).json({
      message: "Bug not found.",
    });
  }

  return res.status(200).json({ message: "Bug deleted successfully!" });
}
