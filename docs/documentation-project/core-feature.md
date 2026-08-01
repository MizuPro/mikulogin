# Modul Inti & Kriptografi (@mikulogin/core)

## Deskripsi Umum
Modul `@mikulogin/core` adalah fondasi utama dari ekosistem Mikulogin. Paket ini bersifat murni TypeScript tanpa ketergantungan pada ORM atau kerangka kerja antarmuka tertentu. Modul ini bertanggung jawab untuk menentukan kontrak antarmuka data (`DatabaseAdapter`, `User`, `Session`) dan menyediakan fungsi utilitas keamanan (hashing password dan pembuatan token sesi).

## Komponen Utama & Logika

### 1. Tipe Data Inti (Interfaces)
Didefinisikan di [`packages/core/src/types.ts`](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/core/src/types.ts#L5-L58):

- **`User`** ([types.ts#L5-L11](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/core/src/types.ts#L5-L11)):
  Interface yang merepresentasikan entitas pengguna dalam sistem (`id`, `email`, `passwordHash`, `name`, `createdAt`).
- **`Session`** ([types.ts#L17-L22](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/core/src/types.ts#L17-L22)):
  Interface yang merepresentasikan sesi aktif pengguna (`id`, `userId`, `expiresAt`, `token`).
- **`DatabaseAdapter`** ([types.ts#L28-L58](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/core/src/types.ts#L28-L58)):
  Kontrak abstraksi Bring Your Own Database (BYOD) yang wajib diimplementasikan oleh seluruh adapter database (Prisma, Drizzle, TypeORM, dll).
  - `getUserByEmail(email: string)`: Mengambil data pengguna berdasarkan email.
  - `createUser(data)`: Membuat entitas pengguna baru.
  - `createSession(userId, token, expiresAt)`: Menyimpan sesi aktif baru.
  - `getSessionAndUser(token)`: Mengambil sesi dan data pengguna sekaligus.

### 2. Utilitas Kriptografi & Keamanan
Didefinisikan di [`packages/core/src/crypto.ts`](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/core/src/crypto.ts#L10-L49):

- **`hashPassword(password: string)`** ([crypto.ts#L10-L17](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/core/src/crypto.ts#L10-L17)):
  Meng-hash password teks polos menggunakan algoritma `bcryptjs` dengan 10 *salt rounds*. Melempar *exception* jika password kosong.
- **`verifyPassword(password: string, hash: string)`** ([crypto.ts#L26-L41](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/core/src/crypto.ts#L26-L41)):
  Membandingkan password teks polos dengan hash tersimpan. Menerapkan penanganan kesalahan eksplisit (*Anti Happy-Path*): mengembalikan `false` secara aman jika hash atau password tidak valid tanpa menyebabkan *crash*.
- **`generateSessionToken()`** ([crypto.ts#L47-L49](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/core/src/crypto.ts#L47-L49)):
  Menghasilkan token sesi acak aman secara kriptografis menggunakan `crypto.randomBytes(32)` (64 karakter hexadecimal).

---

## Alur Kerja (Workflow)

1. Aplikasi memanggil `hashPassword(plainTextPassword)` sebelum menyimpan pengguna baru. ([crypto.ts#L10](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/core/src/crypto.ts#L10))
2. Saat login, aplikasi memanggil `verifyPassword(plainTextPassword, user.passwordHash)` untuk mengecek keabsahan kredensial. ([crypto.ts#L26](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/core/src/crypto.ts#L26))
3. Jika password valid, `generateSessionToken()` dipanggil untuk menghasilkan token sesi baru. ([crypto.ts#L47](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/core/src/crypto.ts#L47))
4. Token disimpan melalui implementasi `DatabaseAdapter`. ([types.ts#L50](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/core/src/types.ts#L50))

---

## Daftar File yang Terlibat
- [`packages/core/src/types.ts`](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/core/src/types.ts) - Definisi antarmuka TypeScript untuk User, Session, dan DatabaseAdapter.
- [`packages/core/src/crypto.ts`](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/core/src/crypto.ts) - Utilitas hashing kata sandi dan pembuatan token sesi.
- [`packages/core/tests/types.test.ts`](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/core/tests/types.test.ts) - Pengujian validasi tipe data inti.
- [`packages/core/tests/crypto.test.ts`](file:///e:/_BELAJAR%20PROGRAMMING_/github/mikulogin-package/packages/core/tests/crypto.test.ts) - Pengujian unit untuk hashing, verifikasi password, dan token sesi.
