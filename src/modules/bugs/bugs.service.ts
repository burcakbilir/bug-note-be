import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";


type LinkedCardInput = {
  id: string;
  provider: string;
  title: string;
  url?: string;
};

type CreateBugInput = {
  title: string;
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

type UpdateBugInput = Partial<CreateBugInput>;

function toPrismaLinkedCard(
  linkedCard: LinkedCardInput | null | undefined,
): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined {
  if (linkedCard === undefined) {
    return undefined;
  }

  if (linkedCard === null) {
    return Prisma.JsonNull;
  }

  return linkedCard;
}

export async function listBugs(ownerId: string) {
  return prisma.bugNote.findMany({
    where: { ownerId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createBug(ownerId: string, input: CreateBugInput) {
  return prisma.bugNote.create({
    data: {
      ownerId,
      title: input.title,
      summary: input.summary,
      status: input.status,
      severity: input.severity,
      project: input.project,
      tags: input.tags,
      stack: input.stack,
      linkedCard: toPrismaLinkedCard(input.linkedCard),
      problem: input.problem,
      observations: input.observations,
      response: input.response,
      possibleCause: input.possibleCause,
      solution: input.solution,
      revisitNote: input.revisitNote,
    },
  });
}

export async function updateBug(
  ownerId: string,
  bugId: string,
  input: UpdateBugInput,
) {
  const existingBug = await prisma.bugNote.findFirst({
    where: { id: bugId, ownerId },
  });

  if (!existingBug) {
    return null;
  }

  return prisma.bugNote.update({
    where: {
      id: bugId,
    },
    data: {
      title: input.title,
      summary: input.summary,
      status: input.status,
      severity: input.severity,
      project: input.project,
      tags: input.tags,
      stack: input.stack,
      linkedCard: toPrismaLinkedCard(input.linkedCard),
      problem: input.problem,
      observations: input.observations,
      response: input.response,
      possibleCause: input.possibleCause,
      solution: input.solution,
      revisitNote: input.revisitNote,
    },
  });
}

export async function deleteBug(ownerId: string, bugId: string) {
  const existingBug = await prisma.bugNote.findFirst({
    where: {
      id: bugId,
      ownerId,
    },
  });

  if (!existingBug) {
    return null;
  }

  return prisma.bugNote.delete({
    where: {
      id: bugId,
    },
  });
}
