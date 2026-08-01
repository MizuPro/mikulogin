import { expect, test, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaAdapter } from "../src/index";

const prisma = new PrismaClient();
const adapter = PrismaAdapter(prisma);

beforeAll(async () => {
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

test("Adapter Database: Operasi User dan Session", async () => {
  // Test 1: Buat User
  const newUser = await adapter.createUser({
    email: "adapter@test.com",
    passwordHash: "dummyhash",
    name: "Tester",
  });
  expect(newUser.email).toBe("adapter@test.com");

  // Test 2: Cari User
  const foundUser = await adapter.getUserByEmail("adapter@test.com");
  expect(foundUser?.id).toBe(newUser.id);

  // Test 3: Buat Session
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 jam
  const session = await adapter.createSession(newUser.id, "token_rahasia_123", expiresAt);
  expect(session.userId).toBe(newUser.id);

  // Test 4: Cari Session
  const sessionData = await adapter.getSessionAndUser("token_rahasia_123");
  expect(sessionData).not.toBeNull();
  expect(sessionData?.user.email).toBe("adapter@test.com");
});

test("Adapter Database: Penanganan Koneksi Putus", async () => {
  // Uji koneksi terputus dengan menggunakan prisma client dengan URL invalid
  const badPrisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://invalid:invalid@127.0.0.1:54321/invalid?connect_timeout=1",
      },
    },
  });
  const badAdapter = PrismaAdapter(badPrisma);
  
  try {
    await badAdapter.getUserByEmail("apa@saja.com");
    // Harusnya melempar ralat
    expect(true).toBe(false); 
  } catch (error: any) {
    expect(error.message).toContain("Gagal mengambil data pengguna dari database");
  } finally {
    await badPrisma.$disconnect();
  }
});

