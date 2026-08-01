import { describe, expect, test } from "vitest";
import { hashPassword, verifyPassword, generateSessionToken } from "@mikulogin/core";

describe("Modul Core - Hashing dan Keamanan (crypto.ts)", () => {
  describe("hashPassword", () => {
    test("harus menghasilkan hash password bcrypt yang valid", async () => {
      const password = "mySecurePassword123";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe("string");
      expect(hash).not.toBe(password);
      expect(hash.startsWith("$2a$") || hash.startsWith("$2b$")).toBe(true);
    });

    test("harus menghasilkan hash unik untuk password yang sama (salt berbeda)", async () => {
      const password = "samePassword123";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    test("harus melempar error jika password kosong (Anti Happy-Path)", async () => {
      await expect(hashPassword("")).rejects.toThrow("Password tidak boleh kosong");
    });
  });

  describe("verifyPassword", () => {
    test("harus mengembalikan true untuk password yang cocok", async () => {
      const password = "correctPassword123";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    test("harus mengembalikan false untuk password yang salah", async () => {
      const password = "correctPassword123";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword("wrongPassword123", hash);
      expect(isValid).toBe(false);
    });

    test("harus menangani password kosong secara aman dan mengembalikan false (Anti Happy-Path)", async () => {
      const hash = await hashPassword("validPassword123");
      const result = await verifyPassword("", hash);
      expect(result).toBe(false);
    });

    test("harus menangani hash string yang kosong atau invalid secara aman (Anti Happy-Path)", async () => {
      const emptyHashResult = await verifyPassword("validPassword123", "");
      expect(emptyHashResult).toBe(false);

      const invalidHashResult = await verifyPassword("validPassword123", "invalid_bcrypt_hash_string");
      expect(invalidHashResult).toBe(false);
    });
  });

  describe("generateSessionToken", () => {
    test("harus menghasilkan token acak 64 karakter hex yang unik", () => {
      const token1 = generateSessionToken();
      const token2 = generateSessionToken();

      expect(token1).toBeDefined();
      expect(typeof token1).toBe("string");
      expect(token1.length).toBe(64);
      expect(token1).not.toBe(token2);
    });
  });
});
