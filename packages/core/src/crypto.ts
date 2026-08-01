import bcrypt from "bcryptjs";
import crypto from "node:crypto";

/**
 * Meng-hash password teks polos menggunakan algoritma bcrypt.
 * @param password Password teks polos yang akan di-hash.
 * @returns Promise yang menghasilkan string hash bcrypt.
 * @throws Error jika password kosong atau bukan string valid.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== "string" || password.trim().length === 0) {
    throw new Error("Password tidak boleh kosong");
  }

  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Memverifikasi apakah password teks polos sesuai dengan hash bcrypt yang tersimpan.
 * Memiliki penanganan kegagalan eksplisit (Anti Happy-Path) untuk input invalid.
 * @param password Password teks polos dari input pengguna.
 * @param hash Hash bcrypt tersimpan yang akan dibandingkan.
 * @returns Promise<boolean> true jika cocok, false jika tidak cocok atau format hash invalid.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || typeof password !== "string" || password.trim().length === 0) {
    return false;
  }

  if (!hash || typeof hash !== "string" || hash.trim().length === 0) {
    return false;
  }

  try {
    return await bcrypt.compare(password, hash);
  } catch (_error) {
    // Menangani kasus jika format hash tidak valid (misal bukan format bcrypt)
    return false;
  }
}

/**
 * Menghasilkan token sesi acak yang aman secara kriptografis (32 byte hex = 64 karakter).
 * @returns String token sesi acak.
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
