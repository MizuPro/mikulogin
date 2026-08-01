import { expect, test } from "vitest";
import type { User, Session, DatabaseAdapter } from "@mikulogin/core";

test("Tipe data User harus memiliki field wajib", () => {
  const user: User = {
    id: "user_123",
    email: "test@example.com",
    passwordHash: "hashed_password_abc",
    name: "Pengguna Uji",
    createdAt: new Date("2026-01-01T00:00:00Z"),
  };
  expect(user.id).toBe("user_123");
  expect(user.email).toBe("test@example.com");
  expect(user.passwordHash).toBe("hashed_password_abc");
  expect(user.name).toBe("Pengguna Uji");
  expect(user.createdAt).toBeInstanceOf(Date);
});

test("Tipe data User mengizinkan name bernilai null", () => {
  const user: User = {
    id: "user_456",
    email: "nullname@example.com",
    passwordHash: "hashed_password_def",
    name: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
  };
  expect(user.name).toBeNull();
});

test("Tipe data Session harus memiliki field wajib", () => {
  const session: Session = {
    id: "session_123",
    userId: "user_123",
    token: "token_abc_123",
    expiresAt: new Date("2026-12-31T23:59:59Z"),
  };
  expect(session.id).toBe("session_123");
  expect(session.userId).toBe("user_123");
  expect(session.token).toBe("token_abc_123");
  expect(session.expiresAt).toBeInstanceOf(Date);
});

test("Tipe DatabaseAdapter memiliki struktur method yang valid", () => {
  const dummyAdapter: DatabaseAdapter = {
    async getUserByEmail(email: string) {
      if (!email) throw new Error("Email wajib diisi");
      return null;
    },
    async createUser(data) {
      if (!data.email || !data.passwordHash) throw new Error("Data user tidak lengkap");
      return {
        id: "generated_id",
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        createdAt: new Date(),
      };
    },
    async createSession(userId, token, expiresAt) {
      if (!userId || !token) throw new Error("Parameter sesi tidak valid");
      return {
        id: "session_generated_id",
        userId,
        token,
        expiresAt,
      };
    },
    async getSessionAndUser(token) {
      if (!token) throw new Error("Token tidak boleh kosong");
      return null;
    },
  };

  expect(typeof dummyAdapter.getUserByEmail).toBe("function");
  expect(typeof dummyAdapter.createUser).toBe("function");
  expect(typeof dummyAdapter.createSession).toBe("function");
  expect(typeof dummyAdapter.getSessionAndUser).toBe("function");
});
