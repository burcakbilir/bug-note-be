import { z } from "zod";

export function isSafeHttpUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

const textField = z.string().max(10000).optional();
const stringList = z.array(z.string().trim().max(50)).max(50).optional();

const linkedCardSchema = z.object({
  id: z.string().trim().min(1).max(100),
  provider: z.enum(["trello", "github", "jira", "linear"]),
  title: z.string().trim().min(1).max(200),
  url: z.string().refine(isSafeHttpUrl, "Invalid link URL").optional(),
});

export const createBugSchema = z.object({
  title: z
    .string({ error: "Bug title is required" })
    .trim()
    .min(1, "Bug title is required")
    .max(200),
  summary: textField,
  status: z
    .enum(["draft", "investigating", "resolved"], { error: "Invalid bug status" })
    .optional(),
  severity: z
    .enum(["low", "medium", "high", "critical"], {
      error: "Invalid bug severity",
    })
    .optional(),
  project: z.string().trim().max(100).optional(),
  tags: stringList,
  stack: stringList,
  linkedCard: linkedCardSchema.nullable().optional(),
  problem: textField,
  observations: textField,
  response: textField,
  possibleCause: textField,
  solution: textField,
  revisitNote: textField,
});

export const updateBugSchema = createBugSchema.partial();