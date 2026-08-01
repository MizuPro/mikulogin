import { expect, test } from "vitest";
import { hashPassword, verifyPassword, generateSessionToken, PrismaAdapter } from "../src/index";

test("Paket Utama Mikulogin: Re-export fungsi core dan adapter", async () => {
  // Test hash dan verifikasi
  const plain = "kataSandiUtama123";
  const hash = await hashPassword(plain);
  expect(hash).not.toBe(plain);

  const isValid = await verifyPassword(plain, hash);
  expect(isValid).toBe(true);

  // Test token
  const token = generateSessionToken();
  expect(token.length).toBe(64);

  // Test fungsi adapter terdefinisi
  expect(typeof PrismaAdapter).toBe("function");
});
