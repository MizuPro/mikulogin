# Dokumentasi Proyek Mikulogin

Selamat datang di pusat dokumentasi resmi proyek **Mikulogin**. Mikulogin adalah framework autentikasi modular untuk Next.js dan Node.js yang mengusung arsitektur *Bring Your Own Database (BYOD)*.

## Daftar Isi Dokumentasi

Berikut adalah daftar panduan dan dokumentasi fitur yang tersedia:

1. [Fitur Inti & Kriptografi (@mikulogin/core)](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/docs/documentation-project/core-feature.md)
   - Penjelasan tipe data dasar (`User`, `Session`, `DatabaseAdapter`).
   - Logika penanganan enkripsi, hashing kata sandi (`bcryptjs`), dan pembuatan token sesi acak yang aman.

2. [Adapter Prisma & Integrasi PostgreSQL (@mikulogin/adapter-prisma)](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/docs/documentation-project/adapter-prisma-feature.md)
   - Dokumentasi Skema Prisma (`User` dan `Session`).
   - Implementasi `PrismaAdapter` dengan penanganan ralat eksplisit (*Anti Happy-Path*) dan pengujian PostgreSQL riil.

---

## Struktur Monorepo & Paket NPM Live

Proyek ini dibangun menggunakan struktur *npm workspaces*:

- **`packages/mikulogin`** ([`mikulogin`](https://www.npmjs.com/package/mikulogin)): Paket utama (*Umbrella package*) yang re-export seluruh fitur core dan adapter sehingga bisa diinstal langsung dengan `npm install mikulogin`.
- **`packages/core`** ([`@mikulogin/core`](https://www.npmjs.com/package/@mikulogin/core)): Modul inti yang independen dari ORM/database.
- **`packages/adapter-prisma`** ([`@mikulogin/adapter-prisma`](https://www.npmjs.com/package/@mikulogin/adapter-prisma)): Adapter resmi untuk Prisma ORM dan PostgreSQL.
- **`packages/nextjs`** ([`@mikulogin/nextjs`](https://www.npmjs.com/package/@mikulogin/nextjs)): Komponen pembantu & middleware untuk aplikasi Next.js (*Stub / In-Progress*).
