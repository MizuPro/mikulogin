# Mikulogin 🔐

Framework autentikasi Next.js & Node.js modular dengan arsitektur **Bring Your Own Database (BYOD)**.

Mikulogin memisahkan logika inti otentikasi (token & hashing) dari layer persistensi data (database adapter), sehingga Anda memiliki kendali penuh atas skema dan tempat penyimpanan data pengguna Anda.

---

## ⚡ Instalasi Cepat (Quick Install)

Anda dapat langsung menginstal paket utama **`mikulogin`**:

```bash
npm install mikulogin @prisma/client bcryptjs
```

Atau jika ingin menginstal paket modularnya secara terpisah:

```bash
npm install @mikulogin/core @mikulogin/adapter-prisma @prisma/client bcryptjs
```

---

## 📦 Paket Monorepo Resmi di NPM

| Paket | Nama Package di NPM | Fungsi | NPM Link |
| :--- | :--- | :--- | :--- |
| `packages/mikulogin` | **`mikulogin`** | Paket utama (Umbrella package) yang meng-ekspor ulang core & adapter | [![npm](https://img.shields.io/npm/v/mikulogin.svg)](https://www.npmjs.com/package/mikulogin) |
| `packages/core` | **`@mikulogin/core`** | Tipe data inti (`User`, `Session`, `DatabaseAdapter`) & utilitas kriptografi | [![npm](https://img.shields.io/npm/v/@mikulogin/core.svg)](https://www.npmjs.com/package/@mikulogin/core) |
| `packages/adapter-prisma` | **`@mikulogin/adapter-prisma`** | Implementasi `DatabaseAdapter` untuk Prisma ORM (PostgreSQL) | [![npm](https://img.shields.io/npm/v/@mikulogin/adapter-prisma.svg)](https://www.npmjs.com/package/@mikulogin/adapter-prisma) |
| `packages/nextjs` | **`@mikulogin/nextjs`** | Helper & komponen Next.js *(Dalam Pengembangan)* | [![npm](https://img.shields.io/npm/v/@mikulogin/nextjs.svg)](https://www.npmjs.com/package/@mikulogin/nextjs) |

---

## 🚀 Panduan Penggunaan (Quick Start)

Semua tipe dan fungsi dapat diimpor langsung dari paket **`mikulogin`**:

```typescript
import { 
  hashPassword, 
  verifyPassword, 
  generateSessionToken, 
  PrismaAdapter 
} from "mikulogin";
import { PrismaClient } from "@prisma/client";

// 1. Inisialisasi Adapter Prisma
const prisma = new PrismaClient();
const authAdapter = PrismaAdapter(prisma);

// 2. Registrasi Pengguna Baru
async function handleRegister(email: string, plainPassword: string, name: string) {
  const passwordHash = await hashPassword(plainPassword);
  return await authAdapter.createUser({ email, passwordHash, name });
}

// 3. Login Pengguna & Pembuatan Token Sesi
async function handleLogin(email: string, plainPassword: string) {
  const user = await authAdapter.getUserByEmail(email);
  if (!user) throw new Error("Pengguna tidak ditemukan");

  const isValid = await verifyPassword(plainPassword, user.passwordHash);
  if (!isValid) throw new Error("Kata sandi salah");

  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 jam

  const session = await authAdapter.createSession(user.id, token, expiresAt);
  return { token, session };
}

// 4. Validasi Token Sesi (Middleware / Request)
async function validateSession(token: string) {
  const result = await authAdapter.getSessionAndUser(token);
  if (!result) return null;

  if (new Date() > result.session.expiresAt) {
    throw new Error("Sesi telah kedaluwarsa");
  }

  return result.user;
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
