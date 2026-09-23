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

export const authRouter = Router();

authRouter.post("/register", registerController);
authRouter.post("/login", loginController);
authRouter.post("/forgot-password", forgotPasswordController);
authRouter.post("/reset-password", resetPasswordController);
authRouter.get("/me", meController);
authRouter.patch("/me", updateMeController);
authRouter.delete("/me", deleteMeController);
authRouter.post("/logout", logoutController);
