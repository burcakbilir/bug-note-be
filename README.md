# Bug Note Backend

Express + Prisma API for the Bug Note debugging memory app.

## Features

- Register, login, logout and current-user endpoints
- httpOnly cookie session with JWT
- Account profile, email, password, saved tags and delete-account endpoints
- Demo password reset flow with short-lived reset token
- Protected bug note CRUD routes
- User-scoped bug notes so users only access their own data
- Prisma/PostgreSQL persistence
- Global 404 and error response middleware

## Tech Stack

- Node.js
- Express 5
- TypeScript
- Prisma 7
- PostgreSQL
- bcryptjs
- jsonwebtoken
- cookie-parser
- cors

## Environment

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Required values:

```bash
PORT=4000
FRONTEND_URL=http://localhost:3000
SESSION_SECRET=replace-with-a-long-random-secret
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/bug_note_be_learning?schema=public
```

## Local Development

Install dependencies:

```bash
npm install
```

Start PostgreSQL:

```bash
docker compose up -d
```

Generate Prisma Client and apply migrations:

```bash
npm run db:generate
npm run db:migrate
```

Start the API:

```bash
npm run dev
```

The API runs on:

```bash
http://localhost:4000
```

## Quality Checks

```bash
npm run build
```

## Main Endpoints

```text
POST   /auth/register
POST   /auth/login
GET    /auth/me
PATCH  /auth/me
DELETE /auth/me
POST   /auth/logout
POST   /auth/forgot-password
POST   /auth/reset-password
GET    /bugs
POST   /bugs
PATCH  /bugs/:id
DELETE /bugs/:id
```

## Auth Notes

The backend sets `bug_note_session` as an httpOnly cookie. Frontend requests must use `credentials: "include"`, and CORS is configured with `FRONTEND_URL`.
