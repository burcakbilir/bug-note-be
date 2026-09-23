export const env = {
  port: Number(process.env.PORT ?? 4000),
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  databaseUrl: process.env.DATABASE_URL,
  sessionSecret:
    process.env.SESSION_SECRET ?? "dev-only-change-this-secret-before-production",
};