import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      SESSION_SECRET: "test-only-secret",
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5433/bug_note_be_learning?schema=public",
    },
  },
});