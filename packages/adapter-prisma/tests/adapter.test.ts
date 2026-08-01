import { expect, test, describe, beforeAll, afterAll } from "vitest";
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

describe("PrismaAdapter - Password Reset", () => {
  let testUserId = "";

  beforeAll(async () => {
    const user = await adapter.createUser({
      email: "test_reset@example.com",
      passwordHash: "dummy_hash",
      name: "Reset Test",
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    await prisma.passwordResetToken.deleteMany();
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  test("harus membuat, menggunakan, dan menolak token kedaluwarsa secara riil", async () => {
    const token = "real_token_123";
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    // Buat token
    await adapter.createPasswordResetToken(testUserId, token, expiresAt);

    // Gunakan token yang benar
    const consumed = await adapter.consumePasswordResetToken(token);
    expect(consumed).not.toBeNull();
    expect(consumed?.userId).toBe(testUserId);

    // Gunakan lagi (harus null karena sudah dihapus otomatis)
    const consumedTwice = await adapter.consumePasswordResetToken(token);
    expect(consumedTwice).toBeNull();
  });

  test("harus mengembalikan null untuk token yang sudah kadaluarsa", async () => {
    const token = "expired_token_456";
    const expiredAt = new Date(Date.now() - 1000 * 60 * 60);

    await adapter.createPasswordResetToken(testUserId, token, expiredAt);

    const consumed = await adapter.consumePasswordResetToken(token);
    expect(consumed).toBeNull();
  });

  test("harus memperbarui password pengguna", async () => {
    const newHash = "new_hashed_password_789";
    await adapter.updateUserPassword(testUserId, newHash);

    const user = await adapter.getUserByEmail("test_reset@example.com");
    expect(user?.passwordHash).toBe(newHash);
  });

  test("harus melempar error saat DB error pada createPasswordResetToken dan updateUserPassword", async () => {
    const badPrisma = new PrismaClient({
      datasources: {
        db: {
          url: "postgresql://invalid:invalid@127.0.0.1:54321/invalid?connect_timeout=1",
        },
      },
    });
    const badAdapter = PrismaAdapter(badPrisma);

    try {
      await badAdapter.createPasswordResetToken("any_id", "any_token", new Date());
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain("Gagal membuat token reset");
    }

    try {
      await badAdapter.updateUserPassword("any_id", "new_hash");
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain("Gagal memperbarui password");
    } finally {
      await badPrisma.$disconnect();
    }
  });
});


