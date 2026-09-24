import { Router } from "express";
import {
  deleteMeController,
  forgotPasswordController,
  loginController,
  logoutController,
  meController,
  registerController,
  resetPasswordController,
  updateMeController,
} from "./auth.controller.js";
import { requireAuth } from "../../middlewares/require-auth.js";

export const authRouter = Router();

authRouter.post("/register", registerController);
authRouter.post("/login", loginController);
authRouter.post("/forgot-password", forgotPasswordController);
authRouter.post("/reset-password", resetPasswordController);
authRouter.get("/me", requireAuth, meController);
authRouter.patch("/me", requireAuth, updateMeController);
authRouter.delete("/me", requireAuth, deleteMeController);
authRouter.post("/logout", logoutController);
