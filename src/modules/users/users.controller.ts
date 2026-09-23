import type { Request, Response } from "express";
import { getUserCount } from "./users.service.js";

export async function getUserCountController(_req: Request, res: Response) {
  const userCount = await getUserCount();

  res.json({
    ok: true,
    userCount,
  });
}
