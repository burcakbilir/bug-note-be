# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Express + Prisma API for Bug Note, a personal debugging memory app. User-scoped bug note CRUD, httpOnly-cookie/JWT session auth, and a demo (non-email) password reset flow.

The frontend lives in the sibling repo `bug-note` and expects this API on `http://localhost:4000` with `credentials: "include"` (CORS is locked to `FRONTEND_URL`).

## Commands

```bash
npm install                # install deps
docker compose up -d        # start Postgres (port 5433 on host)
npm run db:generate          # regenerate Prisma client after schema.prisma changes
npm run db:migrate            # create + apply a dev migration
npm run db:deploy              # apply existing migrations (no new migration)
npm run dev                     # tsx watch src/server.ts, http://localhost:4000
npm run build                    # tsc -> dist/
npm run start                     # node dist/server.js (run build first)
```

There is no test suite (`npm test` is a placeholder that exits with an error) and no lint script configured — don't assume either exists.

Required `.env` (copy from `.env.example`):
```bash
PORT=4000
FRONTEND_URL=http://localhost:3000
SESSION_SECRET=replace-with-a-long-random-secret
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/bug_note_be_learning?schema=public
```
`SESSION_SECRET` falls back to a hardcoded dev string if unset (`src/config/env.ts`) — always set it explicitly outside local dev.

## Architecture

**Module pattern**: each domain under `src/modules/<name>/` is split into `*.routes.ts` (Express `Router`, wires middleware) → `*.controller.ts` (parses/validates `req`, calls the service, shapes the HTTP response) → `*.service.ts` (Prisma calls, business rules, returns plain data or `{ error, status }` objects — never throws for expected failures). Follow this three-file split for any new module; don't put Prisma calls in controllers or `res` handling in services.

Modules: `auth` (register/login/logout/me/password-reset), `bugs` (CRUD, owner-scoped), `users` (currently just a `/users/count` endpoint).

**Auth flow**: `src/lib/session.ts` signs/verifies the JWT (`sessionCookieName = "bug_note_session"`, 7-day expiry). `src/lib/auth.ts#getRequestUser` reads the cookie, verifies it, and loads the user from Prisma — this is the source of truth for "who is logged in," used both by `requireAuth` (middleware, used on `bugs` routes) and by `auth` controllers directly (the `/auth/me`, `/auth/me` PATCH/DELETE routes call `getRequestUser` inline instead of using the `requireAuth` middleware — this is inconsistent with `bugs.routes.ts` but is the existing pattern, not a bug to silently "fix" without asking).

**Password reset is a stub, not real email**: `requestPasswordReset` (`auth.service.ts`) returns the reset URL directly in the JSON response instead of emailing it — this is intentional for local/demo use per the README ("Generate a demo password reset link in local development"), not a bug. If wiring real email delivery, this is the function to change.

**Validation**: no schema library (no Zod/Joi) on this side despite the frontend using Zod. `bugs.controller.ts` has hand-written type-guard validators (`isStringArray`, `isValidLinkedCard`, `validateBugPayload`); `auth.controller.ts` mostly just checks required fields are present and relies on `auth.service.ts` for the rest (e.g. password length, current-password confirmation before email/password changes). Match whichever style the file you're editing already uses.

**Data model** (`prisma/schema.prisma`): `User` 1—N `BugNote` (`onDelete: Cascade`). All bug fields (`problem`, `observations`, `response`, `possibleCause`, `solution`, `revisitNote`, `tags`, `stack`) default to empty string/array rather than being nullable — keep that convention when adding fields. `BugNote.linkedCard` is a nullable `Json` column (shape: `{ id, provider, title, url? }`, `provider` one of `trello | github | jira | linear`, enforced only in `bugs.controller.ts`, not at the DB level).

**Ownership checks**: every bug read/write in `bugs.service.ts` filters by `{ id, ownerId }` (see `updateBug`/`deleteBug` first doing a `findFirst` scoped to the owner before mutating) — always scope new bug queries by the authenticated user's id the same way.
