# Adapter Prisma & Integrasi PostgreSQL (@mikulogin/adapter-prisma)

## Deskripsi Umum
Modul `@mikulogin/adapter-prisma` mengimplementasikan kontrak `DatabaseAdapter` dari `@mikulogin/core` menggunakan **Prisma ORM**. Modul ini menjembatani logika autentikasi Mikulogin dengan database PostgreSQL pengguna. Didesain dengan prinsip **Anti Happy-Path** (penanganan ralat eksplisit pada setiap I/O database) dan **No Fake Mocks** (diverifikasi dengan pengujian integrasi PostgreSQL riil).

## Komponen Utama & Logika

### 1. Skema Prisma
Didefinisikan di [`packages/adapter-prisma/prisma/schema.prisma`](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/prisma/schema.prisma#L10-L25):

- **Model `User`** ([schema.prisma#L10-L17](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/prisma/schema.prisma#L10-L17)):
  Menyimpan `id` (UUID), `email` (Unique), `passwordHash`, `name`, `createdAt`, dan relasi `sessions`.
- **Model `Session`** ([schema.prisma#L19-L25](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/prisma/schema.prisma#L19-L25)):
  Menyimpan `id` (UUID), `userId` (FK ke User dengan `onDelete: Cascade`), `expiresAt`, `token` (Unique), dan relasi `user`.

### 2. Fungsi `PrismaAdapter`
Didefinisikan di [`packages/adapter-prisma/src/index.ts`](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/src/index.ts#L11-L54):

- **`getUserByEmail(email)`** ([index.ts#L13-L20](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/src/index.ts#L13-L20)):
  Mencari entitas pengguna berdasarkan `email`. Dibungkus dalam `try...catch` untuk melempar ralat informatif jika koneksi DB bermasalah.
- **`createUser(data)`** ([index.ts#L21-L28](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/src/index.ts#L21-L28)):
  Membuat catatan `User` baru di database.
- **`createSession(userId, token, expiresAt)`** ([index.ts#L29-L38](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/src/index.ts#L29-L38)):
  Membuat entitas `Session` baru yang terhubung ke `userId`.
- **`getSessionAndUser(token)`** ([index.ts#L39-L52](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/src/index.ts#L39-L52)):
  Mencari sesi berdasarkan `token` dan mengikutsertakan (*include*) data `User` terkait secara atomik.

---

## Alur Kerja (Workflow)

1. Pengembang menginstansiasi `PrismaClient` dan mengumpankannya ke `PrismaAdapter(prisma)`. ([index.ts#L11](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/src/index.ts#L11))
2. Saat pendaftaran pengguna, `createUser()` memanggil `prisma.user.create()`. ([index.ts#L21](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/src/index.ts#L21))
3. Saat autentikasi, `getSessionAndUser()` memvalidasi token dari tabel `Session` PostgreSQL. ([index.ts#L39](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/src/index.ts#L39))
4. Jika database terputus atau mengalami gangguan I/O, `PrismaAdapter` melempar ralat dengan pesan terdeskripsi berbahasa Indonesia secara eksplisit. ([index.ts#L17](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/src/index.ts#L17))

---

## Daftar File yang Terlibat
- [`packages/adapter-prisma/prisma/schema.prisma`](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/prisma/schema.prisma) - Definisi skema database Prisma (User & Session).
- [`packages/adapter-prisma/src/index.ts`](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/src/index.ts) - Implementasi fungsi `PrismaAdapter`.
- [`packages/adapter-prisma/tests/adapter.test.ts`](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/tests/adapter.test.ts) - Pengujian integrasi terhadap server PostgreSQL riil.
