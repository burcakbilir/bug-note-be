import { Router } from "express";
import { createBugController, deleteBugController, listBugsController, updateBugController } from "./bugs.controller.js";
import { requireAuth } from "../../middlewares/require-auth.js";


export const bugsRouter = Router()

bugsRouter.get("/", requireAuth, listBugsController)
bugsRouter.post("/", requireAuth,createBugController)
bugsRouter.patch("/:id", requireAuth, updateBugController)
bugsRouter.delete("/:id", requireAuth, deleteBugController)