# Dokumentasi Proyek Mikulogin

Selamat datang di pusat dokumentasi resmi proyek **Mikulogin**. Mikulogin adalah framework autentikasi modular untuk Next.js dan Node.js yang mengusung arsitektur *Bring Your Own Database (BYOD)*.

## Daftar Isi Dokumentasi

Berikut adalah daftar panduan dan dokumentasi fitur yang tersedia:

1. [Fitur Inti & Kriptografi (@mikulogin/core)](core-feature.md)
   - Penjelasan tipe data dasar (`User`, `Session`, `DatabaseAdapter`).
   - Logika penanganan enkripsi, hashing kata sandi (`bcryptjs`), dan pembuatan token sesi acak yang aman.

2. [Adapter Prisma & Integrasi PostgreSQL (@mikulogin/adapter-prisma)](adapter-prisma-feature.md)
   - Dokumentasi Skema Prisma (`User` dan `Session`).
   - Implementasi `PrismaAdapter` dengan penanganan ralat eksplisit (*Anti Happy-Path*) dan pengujian PostgreSQL riil.

3. [Integrasi Next.js & Komponen UI (@mikulogin/nextjs)](nextjs-feature.md) ⭐ **Baru**
   - Route Handlers siap pakai untuk login, registrasi, dan session (`handleLogin`, `handleRegister`, `handleSession`).
   - Auth helper `auth()` untuk validasi sesi di Server Components & Middleware.
   - Komponen UI React `<SignIn />` dan `<SignUp />` dengan desain Geist modern, Material Symbols Outlined, password visibility toggle, dan Remember Me (30 hari).

---

## Struktur Monorepo & Paket NPM Live

Proyek ini dibangun menggunakan struktur *npm workspaces*:

- **`packages/mikulogin`** ([`mikulogin`](https://www.npmjs.com/package/mikulogin)): Paket utama (*Umbrella package*) yang re-export seluruh fitur core, adapter, dan nextjs. Install dengan `npm install mikulogin`.
- **`packages/core`** ([`@mikulogin/core`](https://www.npmjs.com/package/@mikulogin/core)): Modul inti yang independen dari ORM/database.
- **`packages/adapter-prisma`** ([`@mikulogin/adapter-prisma`](https://www.npmjs.com/package/@mikulogin/adapter-prisma)): Adapter resmi untuk Prisma ORM dan PostgreSQL.
- **`packages/nextjs`** ([`@mikulogin/nextjs`](https://www.npmjs.com/package/@mikulogin/nextjs)): Route Handlers, React UI Components (`<SignIn />`, `<SignUp />`), dan Auth Helper untuk Next.js App Router.
- **`apps/demo`**: Aplikasi playground Next.js untuk menguji komponen UI secara langsung di `localhost:3000`.

---

## Status Pengujian

| Package | Test Suite | Status |
| :--- | :--- | :--- |
| `@mikulogin/core` | 4 unit tests (tipe & kriptografi) | ✅ PASS |
| `@mikulogin/adapter-prisma` | 2 integration tests (PostgreSQL riil) | ✅ PASS |
| `@mikulogin/nextjs` | 17 unit tests (handlers) + 3 component tests | ✅ PASS |
| `mikulogin` | 1 smoke test (re-export) | ✅ PASS |
| **Total** | **36 tests, 6 test files** | **✅ 100% PASS** |
