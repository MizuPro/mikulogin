# Dokumentasi Proyek Mikulogin

Selamat datang di pusat dokumentasi resmi proyek **Mikulogin**. Mikulogin adalah framework autentikasi modular untuk Next.js dan Node.js yang mengusung arsitektur *Bring Your Own Database (BYOD)*.

## Daftar Isi Dokumentasi

Berikut adalah daftar panduan dan dokumentasi fitur yang tersedia:

1. [Fitur Inti & Kriptografi (@mikulogin/core)](core-feature.md)
   - Penjelasan tipe data dasar (`User`, `Session`, `PasswordResetToken`, `DatabaseAdapter`).
   - Logika penanganan enkripsi, hashing kata sandi (`bcryptjs`), dan pembuatan token sesi acak yang aman.

2. [Adapter Prisma & Integrasi PostgreSQL (@mikulogin/adapter-prisma)](adapter-prisma-feature.md)
   - Dokumentasi Skema Prisma (`User`, `Session`, dan `PasswordResetToken`).
   - Implementasi `PrismaAdapter` dengan operasi atomik, penanganan ralat eksplisit (*Anti Happy-Path*), dan pengujian PostgreSQL riil.

3. [Integrasi Next.js & Komponen UI (@mikulogin/nextjs)](nextjs-feature.md) ⭐ **Terbaru**
   - Route Handlers siap pakai untuk login, registrasi, session, serta lupa/reset password (`handleLogin`, `handleRegister`, `handleSession`, `handleForgotPassword`, `handleResetPassword`).
   - Auth helper `auth()` untuk validasi sesi di Server Components & Middleware.
   - Komponen UI React Client `<SignIn />`, `<SignUp />`, `<ForgotPassword />`, dan `<ResetPassword />` dengan desain modern Geist, Material Symbols Outlined, password visibility toggle, dan Remember Me.

---

## Struktur Monorepo & Paket NPM Live

Proyek ini dibangun menggunakan struktur *npm workspaces*:

- **`packages/mikulogin`** ([`mikulogin`](https://www.npmjs.com/package/mikulogin)): Paket utama (*Umbrella package*) yang re-export seluruh fitur core, adapter, dan nextjs. Install dengan `npm install mikulogin`.
- **`packages/core`** ([`@mikulogin/core`](https://www.npmjs.com/package/@mikulogin/core)): Modul inti yang independen dari ORM/database.
- **`packages/adapter-prisma`** ([`@mikulogin/adapter-prisma`](https://www.npmjs.com/package/@mikulogin/adapter-prisma)): Adapter resmi untuk Prisma ORM dan PostgreSQL.
- **`packages/nextjs`** ([`@mikulogin/nextjs`](https://www.npmjs.com/package/@mikulogin/nextjs)): Route Handlers, React UI Components, dan Auth Helper untuk Next.js App Router.
- **`apps/demo`**: Aplikasi playground Next.js untuk menguji komponen UI secara langsung di `localhost:3000`.

---

## Status Pengujian

| Package | Test Suite | Status |
| :--- | :--- | :--- |
| `@mikulogin/core` | 12 unit tests (tipe & kriptografi) | ✅ PASS |
| `@mikulogin/adapter-prisma` | 6 integration tests (PostgreSQL riil) | ✅ PASS |
| `@mikulogin/nextjs` | 28 unit tests (handlers) + 5 component tests | ✅ PASS |
| `mikulogin` | 1 smoke test (re-export) | ✅ PASS |
| **Total** | **52 tests, 6 test files** | **✅ 100% PASS** |
