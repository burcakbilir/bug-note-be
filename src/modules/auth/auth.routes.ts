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
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

export const authRouter = Router();

// Keyed by IP + email so an attacker can't lock a victim out of their account
// just by sending wrong passwords for their email from another IP.
const loginEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  keyGenerator: (req)=> {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : ""
    return `login:${ipKeyGenerator(req.ip ?? "")}:${email}`
  },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message:{
    message: "Too many failed login attempts. Please try again later"
  }
})


authRouter.post("/register", registerController);
authRouter.post("/login", loginEmailLimiter, loginController);
authRouter.post("/forgot-password", forgotPasswordController);
authRouter.post("/reset-password", resetPasswordController);
authRouter.get("/me", requireAuth, meController);
authRouter.patch("/me", requireAuth, updateMeController);
authRouter.delete("/me", requireAuth, deleteMeController);
authRouter.post("/logout", logoutController);
