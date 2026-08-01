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
        const user = await prisma.user.create({
          data: {
            email: data.email,
            passwordHash: data.passwordHash,
            name: data.name,
          },
        });
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
    },
    async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
      try {
        await prisma.passwordResetToken.create({
          data: { userId, token, expiresAt },
        });
      } catch (error) {
        throw new Error(`Gagal membuat token reset: ${(error as Error).message}`);
      }
    },
    async consumePasswordResetToken(token: string): Promise<{ userId: string } | null> {
      try {
        const found = await prisma.passwordResetToken.findUnique({
          where: { token },
        });
        
        if (!found) return null;

        await prisma.passwordResetToken.delete({
          where: { token },
        });

        if (found.expiresAt < new Date()) {
          return null;
        }

        return { userId: found.userId };
      } catch (error) {
        return null;
      }
    },
    async updateUserPassword(userId: string, newPasswordHash: string): Promise<void> {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { passwordHash: newPasswordHash },
        });
      } catch (error) {
        throw new Error(`Gagal memperbarui password: ${(error as Error).message}`);
      }
    }
  };
}
