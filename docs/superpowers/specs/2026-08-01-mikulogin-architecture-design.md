# Desain Arsitektur: mikulogin (Autentikasi Next.js Terstruktur)

## Konteks Proyek
Tujuan utama dari proyek ini adalah membangun sebuah *npm package* (`mikulogin`) yang menyediakan framework autentikasi siap pakai bergaya Clerk, namun berjalan sepenuhnya secara lokal di dalam basis data pengguna (*Bring Your Own Database*). Proyek ini ditujukan khusus untuk ekosistem Next.js (App Router, Server Components, dan Client Components).

## Arsitektur & Struktur Package

`mikulogin` akan mengadopsi pendekatan modular dengan 3 bagian utama:

1. **`@mikulogin/core`**: 
   Bertanggung jawab atas seluruh logika inti autentikasi. Modul ini bersifat *framework-agnostic*.
   - **Tanggung jawab:** Pembuatan token/cookie, enkripsi/hashing *password* (misal menggunakan `bcrypt` atau `argon2`), manajemen sesi, dan validasi input.
2. **`@mikulogin/nextjs`**:
   Pembungkus spesifik (*wrapper*) untuk Next.js.
   - **Tanggung jawab:** Menyediakan *API Route Handlers* (untuk `GET`/`POST`), utilitas proteksi halaman seperti `auth()` untuk *Server Components*, dan mengekspor Komponen UI React (`<SignIn />`, `<SignUp />`).
3. **`@mikulogin/adapter-prisma`** (dan *adapter* lainnya):
   Lapisan penghubung antara *Core* dan database spesifik.
   - **Tanggung jawab:** Menerjemahkan pemanggilan fungsi dari *Core* (seperti `getUserById`) menjadi *query* spesifik ORM (seperti `prisma.user.findUnique`).

## Model Data (Schema)

Untuk memastikan kompatibilitas standar, `mikulogin` membutuhkan skema tabel dasar di database pengguna (contoh dalam Prisma):

- **User**: Tabel profil utama (`id`, `email`, `passwordHash`, `name`, `createdAt`).
- **Session**: Tabel penyimpan sesi aktif (`id`, `userId`, `expiresAt`, `token`).

## Alur Data (Data Flow) & Developer Experience

### 1. Inisialisasi
Pengguna akan membuat file `auth.ts` di dalam aplikasi mereka untuk menghubungkan *package* ini dengan basis data mereka melalui *Adapter*.

```typescript
import { mikulogin } from "@mikulogin/nextjs";
import { PrismaAdapter } from "@mikulogin/adapter-prisma";
import prisma from "./lib/prisma";

export const { GET, POST, auth, signIn, signOut } = mikulogin({
  adapter: PrismaAdapter(prisma),
  secret: process.env.MIKULOGIN_SECRET,
  providers: ["email"] // Fokus awal pada kredensial email/password
});
```

### 2. Penggunaan Komponen UI
Pengguna cukup menggunakan komponen UI tanpa perlu menulis logika integrasi *state* secara manual.

```tsx
import { SignIn } from "@mikulogin/nextjs/components";

export default function LoginPage() {
  return <SignIn path="/login" routing="path" signUpUrl="/register" />;
}
```

### 3. Proteksi Halaman (Server Side)
Untuk melindungi akses halaman rahasia, *developer* menggunakan fungsi pembantu *server-side*.

```tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const session = await auth();
  if (!session) redirect("/login");

  return <h1>Halo, {session.user.name}!</h1>;
}
```

## Penanganan Kegagalan (Failure Handling)

Sesuai dengan aturan global (Anti Happy-Path):
- **Koneksi Database:** Semua pemanggilan ke *Adapter* harus dibungkus dengan mekanisme *try-catch*. Jika database *down*, *package* harus mengembalikan pesan kesalahan yang jelas kepada fungsi pemanggil, bukan *crash* seketika.
- **Validasi Input:** Semua input (email/password) harus divalidasi dengan ketat sebelum diteruskan ke *query* database untuk menghindari injeksi.
- **Graceful Degradation:** Jika sistem *session check* gagal secara *intermittent*, berikan opsi agar UI menampilkan pesan ralat (contoh: "Gagal memverifikasi sesi, silakan muat ulang") ketimbang halaman kosong.

## Rencana Pengujian (Testing Strategy)

Semua lapisan *Core* dan *Adapter* akan memiliki tes terpisah.
- **Unit Tests:** Memastikan hashing dan validasi token bekerja dengan sempurna tanpa menyentuh database.
- **Integration Tests:** Memastikan `PrismaAdapter` benar-benar mampu membaca/menulis ke database (PostgreSQL mock/riil). DILARANG menggunakan *bypass logika* (tidak ada if `db == nil { return }`). Skenario koneksi putus atau invalid input wajib dibuktikan lewat tes ini.
