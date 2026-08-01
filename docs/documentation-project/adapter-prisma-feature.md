# Adapter Prisma & Integrasi PostgreSQL (@mikulogin/adapter-prisma)

## Deskripsi Umum
Modul `@mikulogin/adapter-prisma` mengimplementasikan kontrak `DatabaseAdapter` dari `@mikulogin/core` menggunakan **Prisma ORM**. Modul ini menjembatani logika autentikasi Mikulogin dengan database PostgreSQL pengguna. Didesain dengan prinsip **Anti Happy-Path** (penanganan ralat eksplisit pada setiap I/O database) dan **No Fake Mocks** (diverifikasi dengan pengujian integrasi PostgreSQL riil).

## Komponen Utama & Logika

### 1. Skema Prisma
Didefinisikan di [`packages/adapter-prisma/prisma/schema.prisma`](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/prisma/schema.prisma#L10-L34):

- **Model `User`** ([schema.prisma#L10-L18](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/prisma/schema.prisma#L10-L18)):
  Menyimpan `id` (UUID), `email` (Unique), `passwordHash`, `name`, `createdAt`, relasi `sessions`, dan relasi `passwordResetTokens`.
- **Model `Session`** ([schema.prisma#L20-L26](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/prisma/schema.prisma#L20-L26)):
  Menyimpan `id` (UUID), `userId` (FK ke User dengan `onDelete: Cascade`), `expiresAt`, `token` (Unique), dan relasi `user`.
- **Model `PasswordResetToken`** ([schema.prisma#L28-L34](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/prisma/schema.prisma#L28-L34)):
  Menyimpan `id` (UUID), `userId` (FK ke User dengan `onDelete: Cascade`), `token` (Unique), `expiresAt`, dan relasi `user`.

### 2. Fungsi `PrismaAdapter`
Didefinisikan di [`packages/adapter-prisma/src/index.ts`](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/src/index.ts#L11-L98):

- **`getUserByEmail(email)`** ([index.ts#L13-L20](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/src/index.ts#L13-L20)):
  Mencari entitas pengguna berdasarkan `email`. Dibungkus dalam `try...catch` untuk melempar ralat informatif jika koneksi DB bermasalah.
- **`createUser(data)`** ([index.ts#L21-L28](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/src/index.ts#L21-L28)):
  Membuat catatan `User` baru di database.
- **`createSession(userId, token, expiresAt)`** ([index.ts#L29-L38](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/src/index.ts#L29-L38)):
  Membuat entitas `Session` baru yang terhubung ke `userId`.
- **`getSessionAndUser(token)`** ([index.ts#L39-L52](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/src/index.ts#L39-L52)):
  Mencari sesi berdasarkan `token` dan mengikutsertakan (*include*) data `User` terkait secara atomik.
- **`createPasswordResetToken(userId, token, expiresAt)`** ([index.ts#L59-L67](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/src/index.ts#L59-L67)):
  Menyimpan token reset kata sandi di PostgreSQL.
- **`consumePasswordResetToken(token)`** ([index.ts#L68-L88](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/src/index.ts#L68-L88)):
  Mengosongkan/menghapus token reset dari database secara atomik (`prisma.passwordResetToken.delete({ where: { token } })`). Jika error code Prisma adalah `P2025` (record tidak ditemukan/sudah dipakai), fungsi mengembalikan `null`. Jika terjadi ralat I/O atau koneksi DB, melempar exception eksplisit (*Anti Happy-Path*).
- **`updateUserPassword(userId, newPasswordHash)`** ([index.ts#L89-L98](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/src/index.ts#L89-L98)):
  Memperbarui kolom `passwordHash` pengguna di tabel `User`.

---

## Alur Kerja (Workflow)

1. Pengembang menginstansiasi `PrismaClient` dan mengumpankannya ke `PrismaAdapter(prisma)`. ([index.ts#L11](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/src/index.ts#L11))
2. Saat pendaftaran pengguna, `createUser()` memanggil `prisma.user.create()`. ([index.ts#L21](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/src/index.ts#L21))
3. Saat autentikasi, `getSessionAndUser()` memvalidasi token dari tabel `Session` PostgreSQL. ([index.ts#L39](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/src/index.ts#L39))
4. Saat permintaan reset password, `createPasswordResetToken()` menyimpan token reset. ([index.ts#L59](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/src/index.ts#L59))
5. Saat eksekusi reset password, `consumePasswordResetToken()` mengomsumsi token secara atomik. ([index.ts#L68](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/src/index.ts#L68))
6. Jika database terputus atau mengalami gangguan I/O, `PrismaAdapter` melempar ralat dengan pesan terdeskripsi berbahasa Indonesia secara eksplisit. ([index.ts#L83](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/src/index.ts#L83))

---

## Daftar File yang Terlibat
- [`packages/adapter-prisma/prisma/schema.prisma`](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/prisma/schema.prisma) - Definisi skema database Prisma (User, Session, PasswordResetToken).
- [`packages/adapter-prisma/src/index.ts`](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/src/index.ts) - Implementasi fungsi `PrismaAdapter`.
- [`packages/adapter-prisma/tests/adapter.test.ts`](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/adapter-prisma/tests/adapter.test.ts) - Pengujian integrasi terhadap server PostgreSQL riil.
