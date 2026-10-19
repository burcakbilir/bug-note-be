import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { bugsRouter } from "./modules/bugs/bugs.routes.js";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler.js";

export const app = express();

app.set("trust proxy", 4)

app.use(helmet());
app.use(cors({ origin: env.frontendUrl, credentials: true }));

app.use(express.json());
app.use(cookieParser());


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

app.use("/auth", authLimiter, authRouter);
app.use("/users", usersRouter);
app.use("/bugs", bugsRouter);

app.use(notFoundHandler);
app.use(errorHandler);
