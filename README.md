# Mikulogin 🔐

Framework autentikasi Next.js & Node.js modular dengan arsitektur **Bring Your Own Database (BYOD)**.

Mikulogin memisahkan logika inti otentikasi (token & hashing) dari layer persistensi data (database adapter), sehingga Anda memiliki kendali penuh atas skema dan tempat penyimpanan data pengguna Anda.

---

## 📦 Paket Monorepo

| Paket | Nama Package | Fungsi |
| :--- | :--- | :--- |
| `packages/core` | `@mikulogin/core` | Tipe data inti (`User`, `Session`, `DatabaseAdapter`) & utilitas kriptografi |
| `packages/adapter-prisma` | `@mikulogin/adapter-prisma` | Implementasi `DatabaseAdapter` untuk Prisma ORM (PostgreSQL) |
| `packages/nextjs` | `@mikulogin/nextjs` | Helper & komponen Next.js *(Dalam Pengembangan)* |

---

## ⚡ Instalasi

```bash
# Instalasi di dalam proyek Anda
npm install @mikulogin/core @mikulogin/adapter-prisma @prisma/client bcryptjs
```

---

## 🚀 Panduan Penggunaan (Quick Start)

### 1. Inisialisasi Adapter

```typescript
// lib/auth.ts
import { PrismaClient } from "@prisma/client";
import { PrismaAdapter } from "@mikulogin/adapter-prisma";

const prisma = new PrismaClient();
export const authAdapter = PrismaAdapter(prisma);
```

### 2. Registrasi & Hashing Password

```typescript
import { hashPassword } from "@mikulogin/core";
import { authAdapter } from "./lib/auth";

async function handleRegister(email: string, plainPassword: string, name: string) {
  // Hash password dengan bcrypt
  const passwordHash = await hashPassword(plainPassword);

  // Simpan ke database via adapter
  const user = await authAdapter.createUser({
    email,
    passwordHash,
    name,
  });

  return user;
}
```

### 3. Login & Pembuatan Token Sesi

```typescript
import { verifyPassword, generateSessionToken } from "@mikulogin/core";
import { authAdapter } from "./lib/auth";

async function handleLogin(email: string, plainPassword: string) {
  const user = await authAdapter.getUserByEmail(email);
  if (!user) throw new Error("Pengguna tidak ditemukan");

  // Verifikasi kata sandi
  const isValid = await verifyPassword(plainPassword, user.passwordHash);
  if (!isValid) throw new Error("Kata sandi salah");

  // Buat token sesi acak (64 karakter hex)
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 jam

  const session = await authAdapter.createSession(user.id, token, expiresAt);
  return { token, session };
}
```

### 4. Validasi Token Sesi

```typescript
import { authAdapter } from "./lib/auth";

async function validateSession(token: string) {
  const result = await authAdapter.getSessionAndUser(token);
  if (!result) return null;

  const { session, user } = result;
  if (new Date() > session.expiresAt) {
    throw new Error("Sesi telah kedaluwarsa");
  }

  return user;
}
```

---

## 🧪 Jalankan Pengujian (Testing)

Proyek ini menggunakan **Vitest** untuk unit test dan pengujian integrasi PostgreSQL riil (*No Fake Mocks*):

```bash
# Jalankan seluruh pengujian
npx vitest run
```

---

## 📖 Dokumentasi Lengkap Proyek

Dokumentasi detail dari tiap komponen tersedia di folder `docs/documentation-project/`:

- 📘 [Indeks Dokumentasi Proyek](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/docs/documentation-project/index.md)
- 📘 [Dokumentasi Modul Core (@mikulogin/core)](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/docs/documentation-project/core-feature.md)
- 📘 [Dokumentasi Adapter Prisma (@mikulogin/adapter-prisma)](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/docs/documentation-project/adapter-prisma-feature.md)
