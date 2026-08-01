import { mikulogin, PrismaAdapter } from "mikulogin";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
const env = (process as any).env || {};
if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const authHandler = mikulogin({
  adapter: PrismaAdapter(prisma),
  secret: env.MIKULOGIN_SECRET || "demo-secret-key-super-secure-32-chars-long",
});

export async function POST(req: Request) {
  return authHandler.handleLogin(req);
}
