import type { Request, Response, NextFunction } from "express";
import { getRequestUser } from "../lib/auth";

export async function requireAuth(req: Request, res:Response, next:NextFunction) {
    const user = await getRequestUser(req)

    if(!user){
        return res.status(401).json({
            message:"Unauthorized"
        })
    }

    req.user = user
    next()
}