import { expect, test } from "vitest";
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  PrismaAdapter,
  SignIn,
  SignUp,
  mikulogin,
} from "../src/index";

test("Paket Utama Mikulogin: Re-export fungsi core, adapter, handlers, dan komponen UI", async () => {
  // Test hash dan verifikasi
  const plain = "kataSandiUtama123";
  const hash = await hashPassword(plain);
  expect(hash).not.toBe(plain);

  const isValid = await verifyPassword(plain, hash);
  expect(isValid).toBe(true);

  // Test token
  const token = generateSessionToken();
  expect(token.length).toBe(64);

  // Test kelas adapter terdefinisi
  expect(typeof PrismaAdapter).toBe("function");

  // Test handler dan komponen UI ter-export dari paket utama
  expect(typeof mikulogin).toBe("function");
  expect(typeof SignIn).toBe("function");
  expect(typeof SignUp).toBe("function");
});
