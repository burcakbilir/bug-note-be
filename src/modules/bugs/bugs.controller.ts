import type { Request, Response } from "express";
import { createBug, deleteBug, listBugs, updateBug } from "./bugs.service.js";


type LinkedCardInput = {
  id: string;
  provider: string;
  title: string;
  url?: string;
};

const bugStatuses = ["draft", "investigating", "resolved"] as const;
const bugSeverities = ["low", "medium", "high", "critical"] as const;
const linkedCardProviders = ["trello", "github", "jira", "linear"] as const;

function isStringArray(value: unknown) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isValidLinkedCard(value: unknown): value is LinkedCardInput {
  if (!value || typeof value !== "object") return false;

  const card = value as Record<string, unknown>;

  return (
    typeof card.id === "string" &&
    typeof card.title === "string" &&
    typeof card.provider === "string" &&
    linkedCardProviders.includes(
      card.provider as (typeof linkedCardProviders)[number],
    ) &&
    (card.url === undefined || typeof card.url === "string")
  );
}

function validateBugPayload(body: Record<string, unknown>, mode: "create" | "update") {
  if (mode === "create" && typeof body.title !== "string") {
    return "Bug title is required";
  }

  if (body.title !== undefined && (typeof body.title !== "string" || !body.title.trim())) {
    return "Bug title is required";
  }

  if (body.status !== undefined && !bugStatuses.includes(body.status as never)) {
    return "Invalid bug status";
  }

  if (
    body.severity !== undefined &&
    !bugSeverities.includes(body.severity as never)
  ) {
    return "Invalid bug severity";
  }

  if (body.tags !== undefined && !isStringArray(body.tags)) {
    return "Tags must be a string array";
  }

  if (body.stack !== undefined && !isStringArray(body.stack)) {
    return "Stack must be a string array";
  }

  if (
    body.linkedCard !== undefined &&
    body.linkedCard !== null &&
    !isValidLinkedCard(body.linkedCard)
  ) {
    return "Invalid linked card";
  }

  return null;
}

function getAuthenticatedUser(req: Request) {
  if (!req.user) {
    throw new Error("Authenticated user is missing");
  }
  return req.user;
}

export async function listBugsController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);

  const bugs = await listBugs(user.id);

  return res.json({
    bugs,
  });
}

export async function createBugController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);

  const body = req.body as {
    title?: string;
    summary?: string;
    status?: string;
    severity?: string;
    project?: string;
    tags?: string[];
    stack?: string[];
    linkedCard?: LinkedCardInput | null;
    problem?: string;
    observations?: string;
    response?: string;
    possibleCause?: string;
    solution?: string;
    revisitNote?: string;
  };

  const validationError = validateBugPayload(body, "create");

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const bug = await createBug(user.id, {
    title: body.title as string,
    summary: body.summary,
    status: body.status,
    severity: body.severity,
    project: body.project,
    tags: body.tags,
    stack: body.stack,
    linkedCard: body.linkedCard,
    problem: body.problem,
    observations: body.observations,
    response: body.response,
    possibleCause: body.possibleCause,
    solution: body.solution,
    revisitNote: body.revisitNote,
  });

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

  const validationError = validateBugPayload(req.body, "update");

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const bug = await updateBug(user.id, bugId, req.body);

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
