import { Router } from "express";
import { getUserCountController } from "./users.controller";


export const usersRouter = Router()

usersRouter.get("/count", getUserCountController)