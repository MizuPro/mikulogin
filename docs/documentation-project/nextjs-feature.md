# Dokumentasi: @mikulogin/nextjs

Modul `@mikulogin/nextjs` menyediakan integrasi siap pakai untuk Next.js App Router, mencakup:

1. **Route Handlers** — `handleLogin`, `handleRegister`, `handleSession`, `handleForgotPassword`, `handleResetPassword`
2. **Auth Helper** — `auth()` untuk validasi sesi di Server Component & Middleware
3. **Komponen UI React** — `<SignIn />`, `<SignUp />`, `<ForgotPassword />`, `<ResetPassword />` dengan desain modern Geist + Material Symbols

---

## Instalasi

```bash
npm install mikulogin @prisma/client bcryptjs react react-dom
```

Font yang digunakan komponen UI (tambahkan ke `layout.tsx`):

```html
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap" rel="stylesheet" />
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
```

---

## Fungsi `mikulogin(config)`

Fungsi factory utama yang mengembalikan kumpulan handler dan helper.

```typescript
import { mikulogin, PrismaAdapter } from "mikulogin";
import { PrismaClient } from "@prisma/client";

const {
  handleLogin,
  handleRegister,
  handleSession,
  handleForgotPassword,
  handleResetPassword,
  auth,
} = mikulogin({
  adapter: PrismaAdapter(new PrismaClient()),
  secret: process.env.AUTH_SECRET!,
  sessionMaxAge: 86400, // opsional, default: 86400 detik (24 jam)
  sendPasswordResetEmail: async (email, resetUrl) => {
    // opsional, contoh: panggil Resend/Nodemailer
    console.log(`Kirim email reset ke ${email}: ${resetUrl}`);
  },
});
```

### Parameter Konfigurasi

| Parameter | Tipe | Wajib | Deskripsi |
| :--- | :--- | :--- | :--- |
| `adapter` | `DatabaseAdapter` | Ya | Instance adapter database (misal `PrismaAdapter`) |
| `secret` | `string` | Ya | Secret key untuk keamanan aplikasi |
| `sessionMaxAge` | `number` | Tidak | Durasi sesi default dalam detik (default: `86400` = 24 jam) |
| `sendPasswordResetEmail` | `(email: string, resetUrl: string) => Promise<void>` | Tidak | Callback async untuk pengiriman email reset kata sandi |

---

## Route Handlers

### `handleLogin(req: Request): Promise<Response>`

Memproses login pengguna. Menerima JSON body `{ email, password, rememberMe? }`.

- **Sukses (200):** Set cookie `mikulogin_session`, return `{ success: true, user: { id, email, name } }`.
- **rememberMe = true:** Cookie berumur 30 hari (2592000 detik), bukan default.
- **Gagal (401):** `{ success: false, error: "Email atau password salah" }`.
- **Body tidak valid (400):** `{ success: false, error: "Format JSON tidak valid" }`.

```typescript
// app/api/auth/login/route.ts
export const POST = (req: Request) => handleLogin(req);
```

### `handleRegister(req: Request): Promise<Response>`

Mendaftarkan pengguna baru. Menerima JSON body `{ email, password, name? }`.

- **Sukses (201):** Return `{ success: true, user: { id, email, name } }`.
- **Email duplikat (400):** `{ success: false, error: "Email sudah terdaftar" }`.

```typescript
// app/api/auth/register/route.ts
export const POST = (req: Request) => handleRegister(req);
```

### `handleSession(req: Request): Promise<Response>`

Memvalidasi sesi aktif dari cookie header.

- **Sukses (200):** Return `{ success: true, user: { id, email, name }, session }`. **Catatan: `passwordHash` tidak dikembalikan.**
- **Tidak autentik (401):** `{ success: false, session: null, user: null }`.

```typescript
// app/api/auth/session/route.ts
export const GET = (req: Request) => handleSession(req);
```

### `handleForgotPassword(req: Request): Promise<Response>` ⭐ **Baru**

Memproses permintaan reset kata sandi. Menerima JSON body `{ email, resetUrlBase }`.

- **Sukses (200):** Return `{ message: "Jika email valid, tautan reset telah dikirim." }`. (Proteksi *Anti User Enumeration*: Mengembalikan pesan sukses generik bahkan jika email tidak terdaftar).
- **Callback Email:** Memanggil `sendPasswordResetEmail(email, `${resetUrlBase}?token=${token}`)` jika dikonfigurasi.
- **Param kosong (400):** `{ error: "Email dan resetUrlBase wajib diisi" }`.
- **DB error (500):** `{ error: "Terjadi kesalahan server" }`.

```typescript
// app/api/auth/forgot-password/route.ts
export const POST = (req: Request) => handleForgotPassword(req);
```

### `handleResetPassword(req: Request): Promise<Response>` ⭐ **Baru**

Memproses pembaruan kata sandi menggunakan token reset. Menerima JSON body `{ token, newPassword }`.

- **Sukses (200):** Return `{ message: "Kata sandi berhasil diperbarui" }`.
- **Token expired/invalid (400):** `{ error: "Tautan reset tidak valid atau sudah kedaluwarsa" }`.
- **Password pendek (400):** `{ error: "Token tidak valid atau kata sandi terlalu pendek" }`.
- **DB error (500):** `{ error: "Terjadi kesalahan server" }`.

```typescript
// app/api/auth/reset-password/route.ts
export const POST = (req: Request) => handleResetPassword(req);
```

---

## Auth Helper: `auth(tokenOrCookieHeader?)`

Fungsi async untuk memvalidasi token sesi langsung dari string cookie header atau token mentah.

```typescript
import { cookies } from "next/headers";

// Di Server Component:
const cookieHeader = cookies().toString();
const result = await auth(cookieHeader);
// result = { user: { id, email, name, ... }, session } | null
```

---

## Komponen UI: `<SignIn />`

Komponen React Client (`"use client"`) untuk halaman login dengan desain Geist + Material Symbols Outlined.

---

## Komponen UI: `<SignUp />`

Komponen React Client (`"use client"`) untuk halaman registrasi dengan desain yang seragam dengan `<SignIn />`.

---

## Komponen UI: `<ForgotPassword />` ⭐ **Baru**

Komponen React Client (`"use client"`) untuk alur Lupa Kata Sandi.

**Fitur:**
- Input alamat email dengan penanganan state `idle`, `loading`, `success`, `error`.
- Mengirim payload `{ email, resetUrlBase }` ke endpoint `/api/auth/forgot-password`.
- Penanganan I/O Failure: Aman dari crash jika API mengembalikan respons non-JSON / server error 500.

### Props

| Prop | Tipe | Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `theme` | `"light" \| "dark"` | `"light"` | Pilihan tema UI |
| `forgotPasswordApiUrl` | `string` | `"/api/auth/forgot-password"` | Endpoint API forgot password |
| `signInUrl` | `string` | `"/login"` | Tautan kembali ke halaman login |
| `title` | `string` | `"Reset Kata Sandi"` | Judul kartu UI |
| `subtitle` | `string` | `"Masukkan email Anda..."` | Sub-judul kartu UI |

```tsx
import { ForgotPassword } from "@mikulogin/nextjs";

<ForgotPassword
  theme="dark"
  forgotPasswordApiUrl="/api/auth/forgot-password"
  signInUrl="/login"
/>
```

---

## Komponen UI: `<ResetPassword />` ⭐ **Baru**

Komponen React Client (`"use client"`) untuk alur Reset Kata Sandi Baru.

**Fitur:**
- Membaca query parameter `token` secara otomatis dari URL (`window.location.search`).
- Tampilan form kata sandi baru (minimal 8 karakter) dengan konfirmasi tombol.
- Tampilan pesan sukses + tombol navigasi cepat ke halaman login setelah kata sandi berhasil diperbarui.

### Props

| Prop | Tipe | Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `theme` | `"light" \| "dark"` | `"light"` | Pilihan tema UI |
| `resetPasswordApiUrl` | `string` | `"/api/auth/reset-password"` | Endpoint API reset password |
| `signInUrl` | `string` | `"/login"` | Tautan ke halaman login setelah sukses |
| `title` | `string` | `"Buat Kata Sandi Baru"` | Judul kartu UI |
| `subtitle` | `string` | `"Masukkan kata sandi baru..."` | Sub-judul kartu UI |

```tsx
import { ResetPassword } from "@mikulogin/nextjs";

<ResetPassword
  theme="light"
  resetPasswordApiUrl="/api/auth/reset-password"
  signInUrl="/login"
/>
```

---

## Penanganan Error (Anti Happy-Path)

Semua handler dan komponen dirancang untuk **tidak pernah crash**:

| Skenario | Respons |
| :--- | :--- |
| Body JSON tidak valid / malformed | `400 { success: false, error: "Format JSON tidak valid" }` |
| Email atau password salah | `401 { success: false, error: "Email atau password salah" }` |
| Email sudah terdaftar | `400 { success: false, error: "Email sudah terdaftar" }` |
| Token reset tidak ditemukan / expired | `400 { error: "Tautan reset tidak valid atau sudah kedaluwarsa" }` |
| Database down / error | `500 { success: false, error: "Terjadi kesalahan server" }` |
| Server 500 HTML Response di UI Component | Menampilkan alert ralat tanpa melempar unhandled promise rejection |

---

## Keamanan

- ✅ `passwordHash` **tidak pernah dikembalikan** ke client di semua endpoint
- ✅ Cookie di-set dengan `HttpOnly`, `SameSite=Lax`, `Path=/`
- ✅ Session & Reset Token di-generate menggunakan `crypto.randomBytes(32)` / `crypto.randomUUID()`
- ✅ Proteksi Anti User Enumeration pada endpoint `handleForgotPassword`
