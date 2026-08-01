import type { PrismaClient } from "@prisma/client";
import type { DatabaseAdapter, User, Session } from "@mikulogin/core";

/**
 * PrismaAdapter mengimplementasikan antarmuka DatabaseAdapter menggunakan Prisma ORM.
 * Menyediakan metode untuk mengelola pengguna dan sesi dengan penanganan ralat eksplisit (Anti Happy-Path).
 * 
 * @param prisma Instans PrismaClient yang terhubung ke database PostgreSQL.
 * @returns Objek yang memenuhi antarmuka DatabaseAdapter.
 */
export function PrismaAdapter(prisma: PrismaClient): DatabaseAdapter {
  return {
    async getUserByEmail(email: string): Promise<User | null> {
      try {
        const user = await prisma.user.findUnique({ where: { email } });
        return user;
      } catch (error) {
        throw new Error(`Gagal mengambil data pengguna dari database: ${(error as Error).message}`);
      }
    },
    async createUser(data: Omit<User, "id" | "createdAt">): Promise<User> {
      try {
        const user = await prisma.user.create({ data });
        return user;
      } catch (error) {
        throw new Error(`Gagal membuat data pengguna baru: ${(error as Error).message}`);
      }
    },
    async createSession(userId: string, token: string, expiresAt: Date): Promise<Session> {
      try {
        const session = await prisma.session.create({
          data: { userId, token, expiresAt },
        });
        return session;
      } catch (error) {
        throw new Error(`Gagal menyimpan sesi ke database: ${(error as Error).message}`);
      }
    },
    async getSessionAndUser(token: string): Promise<{ session: Session; user: User } | null> {
      try {
        const session = await prisma.session.findUnique({
          where: { token },
          include: { user: true },
        });
        if (!session) return null;
        
        const { user, ...sessionData } = session;
        return { session: sessionData, user };
      } catch (error) {
        throw new Error(`Gagal memvalidasi sesi dari database: ${(error as Error).message}`);
      }
    }
  };
}
