import { prisma } from "../../lib/prisma.js";

export async function  getUserCount() {
    return prisma.user.count()
    
}