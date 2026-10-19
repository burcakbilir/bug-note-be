import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is required. Run this with your production connection string, e.g.\n" +
      '  DATABASE_URL="postgresql://..." npx tsx scripts/seed-demo.ts',
  );
}

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_EMAIL = "demo@bugnote.dev";
const DEMO_PASSWORD = "demo1234";
const SALT_ROUNDS = 10;

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const demoNotes = [
  {
    title: "Stale cart total after applying a discount code",
    summary: "Cart total doesn't recalculate until the page is refreshed.",
    status: "resolved",
    severity: "medium",
    project: "checkout-service",
    tags: ["frontend", "state"],
    stack: ["React", "Redux Toolkit"],
    problem:
      "Applying a discount code updates the code list in the UI, but the displayed cart total keeps showing the pre-discount amount.",
    observations:
      "The discount is correctly saved in the Redux store right after the API call resolves. Refreshing the page shows the correct total immediately.",
    response: "",
    possibleCause:
      "The total was memoized with a selector that only depended on the cart items array, not on the applied discounts array, so it never recomputed.",
    solution:
      "Added the discounts array to the selector's dependency list so the memoized total recalculates whenever a discount is applied or removed.",
    revisitNote: "Check other derived selectors in the cart slice for the same missing-dependency pattern.",
  },
  {
    title: "401 loop on token refresh under slow network",
    summary: "Users get logged out repeatedly when the access token expires mid-session on a slow connection.",
    status: "investigating",
    severity: "high",
    project: "auth-gateway",
    tags: ["backend", "auth"],
    stack: ["Express", "JWT"],
    problem:
      "When the access token expires while several requests are in flight, each request triggers its own refresh call, and slower ones race against an already-rotated refresh token.",
    observations:
      "Reproduced by throttling the network to 3G and firing three parallel API calls right as the token TTL runs out. Two of three refresh attempts return 401.",
    response: "500 from the auth service on the second refresh attempt: \"refresh token already used\".",
    possibleCause:
      "No request-level lock around the refresh flow, so concurrent 401s each start their own refresh instead of sharing one in-flight request.",
    solution: "",
    revisitNote: "Plan to queue concurrent 401s behind a single shared refresh promise and replay the queued requests once it resolves.",
  },
  {
    title: "Linked Jira card shows the wrong status after a webhook update",
    summary: "The linked-card badge in a bug note doesn't reflect the Jira issue's current status.",
    status: "draft",
    severity: "low",
    project: "bug-note-be",
    tags: ["integrations"],
    stack: ["Node.js", "Webhooks"],
    problem:
      "A bug note linked to a Jira issue keeps showing \"In Progress\" in its badge even after the Jira issue was moved to \"Done\".",
    observations:
      "The webhook payload arrives with the updated status, and it's logged correctly on the backend, but the stored linkedCard JSON on the note is never rewritten.",
    response: "",
    possibleCause: "The webhook handler validates the payload but the update branch for status changes was never implemented, only creation was.",
    solution: "",
    revisitNote: "Needs a status-update branch in the Jira webhook handler that patches linkedCard.status on the matching note.",
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      name: "Demo User",
      email: DEMO_EMAIL,
      initials: getInitials("Demo User"),
      passwordHash,
      savedTags: ["frontend", "backend", "auth"],
    },
  });

  for (const note of demoNotes) {
    const existing = await prisma.bugNote.findFirst({
      where: { ownerId: user.id, title: note.title },
    });

    if (existing) {
      continue;
    }

    await prisma.bugNote.create({
      data: { ...note, ownerId: user.id },
    });
  }

  console.log(`Demo user ready: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`Seeded ${demoNotes.length} bug notes (skipping any that already exist).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
