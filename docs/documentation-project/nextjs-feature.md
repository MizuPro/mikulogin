# Dokumentasi: @mikulogin/nextjs

Modul `@mikulogin/nextjs` menyediakan integrasi siap pakai untuk Next.js App Router, mencakup:

1. **Route Handlers** — `handleLogin`, `handleRegister`, `handleSession`
2. **Auth Helper** — `auth()` untuk validasi sesi di Server Component & Middleware
3. **Komponen UI React** — `<SignIn />` dan `<SignUp />` dengan desain modern Geist + Material Symbols

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

const { handleLogin, handleRegister, handleSession, auth } = mikulogin({
  adapter: PrismaAdapter(new PrismaClient()),
  secret: process.env.AUTH_SECRET!,
  sessionMaxAge: 86400, // opsional, default: 86400 detik (24 jam)
});
```

### Parameter Konfigurasi

| Parameter | Tipe | Wajib | Deskripsi |
| :--- | :--- | :--- | :--- |
| `adapter` | `DatabaseAdapter` | Ya | Instance adapter database (misal `PrismaAdapter`) |
| `secret` | `string` | Ya | Secret key untuk keamanan aplikasi |
| `sessionMaxAge` | `number` | Tidak | Durasi sesi default dalam detik (default: `86400` = 24 jam) |

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

**Perilaku:**
- Mengekstrak token `mikulogin_session` dari cookie header menggunakan regex presisi.
- Memeriksa expiry sesi.
- Mengembalikan `null` (bukan throw) jika tidak autentik, kedaluwarsa, atau error — aman untuk middleware.

---

## Komponen UI: `<SignIn />`

Komponen React untuk halaman login dengan desain Geist + Material Symbols Outlined.

**Fitur:**
- **Pilihan Tema (`theme`)**: Mengdukung `light` mode dan `dark` (OLED Pitch-Black) mode.
- **Spotlight Hover Effect**: Tombol submit dilengkapi dengan animasi pendaran cahaya (*glowing border beam & ambient aura*) yang melacak posisi kursor.
- **Custom Animated Checkbox**: Checkbox berbentuk lingkaran dengan efek *spring pop animation* dan ikon centang dinamis.
- **Sliding Gradient Underline**: Tautan teks ("Forgot password?", "Create Account") menggunakan animasi garis bawah meluncur dan efek pendaran cahaya teks (*text glow*).
- Input email dan password dengan ikon Material Symbols
- Toggle show/hide password (`visibility` / `visibility_off`)
- Loading state (button & input di-disable)
- Error state ditampilkan dengan alert merah
- SSR-safe (`window.location` hanya diakses di client)
- Race condition safe (double-submit dicegah via `disabled={loading}`)

### Props

| Prop | Tipe | Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `theme` | `"light" \| "dark"` | `"light"` | Pilihan tema UI (Light Mode atau Dark Mode) |
| `loginApiUrl` | `string` | `"/api/auth/login"` | Endpoint API login |
| `redirectTo` | `string` | `"/dashboard"` | Redirect setelah sukses |
| `signUpUrl` | `string` | `"/register"` | URL halaman daftar |
| `forgotPasswordUrl` | `string` | `"#"` | URL lupa kata sandi |
| `title` | `string` | `"Welcome Back"` | Judul halaman |
| `subtitle` | `string` | `"..."` | Sub-judul |
| `protocolText` | `string` | `"Mikulogin Security Protocol V2.4"` | Teks footer branding |
| `onSuccess` | `(data: any) => void` | - | Callback setelah sukses |

```tsx
<SignIn
  loginApiUrl="/api/auth/login"
  signUpUrl="/register"
  redirectTo="/dashboard"
  title="Selamat Datang"
/>
```

---

## Komponen UI: `<SignUp />`

Komponen React untuk halaman registrasi dengan desain yang seragam dengan `<SignIn />`.

**Fitur:**
- Input nama lengkap, email, dan password
- Toggle show/hide password
- Loading & error state
- Success state + auto-redirect ke halaman login setelah 1.5 detik

### Props

| Prop | Tipe | Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `theme` | `"light" \| "dark"` | `"light"` | Pilihan tema UI (Light Mode atau Dark Mode) |
| `registerApiUrl` | `string` | `"/api/auth/register"` | Endpoint API registrasi |
| `signInUrl` | `string` | `"/login"` | URL halaman login |
| `title` | `string` | `"Create Account"` | Judul halaman |
| `subtitle` | `string` | `"..."` | Sub-judul |
| `protocolText` | `string` | `"Mikulogin Security Protocol V2.4"` | Teks footer branding |
| `onSuccess` | `(data: any) => void` | - | Callback setelah sukses |

```tsx
<SignUp
  registerApiUrl="/api/auth/register"
  signInUrl="/login"
  title="Buat Akun Baru"
/>
```

---

## Aplikasi Demo (`apps/demo`)

Playground Next.js App Router untuk menguji komponen UI secara langsung.

```bash
# Jalankan demo app
cd apps/demo
npm run dev
# Buka http://localhost:3000
```

**Rute yang tersedia:**
- `/login` — Halaman login menggunakan `<SignIn />`
- `/register` — Halaman registrasi menggunakan `<SignUp />`
- `/api/auth/login` — Route Handler login
- `/api/auth/register` — Route Handler registrasi

---

## Penanganan Error (Anti Happy-Path)

Semua handler dirancang untuk **tidak pernah crash**:

| Skenario | Respons |
| :--- | :--- |
| Body JSON tidak valid / malformed | `400 { success: false, error: "Format JSON tidak valid" }` |
| Email atau password salah | `401 { success: false, error: "Email atau password salah" }` |
| Email sudah terdaftar | `400 { success: false, error: "Email sudah terdaftar" }` |
| Database down / error | `500 { success: false, error: "Gagal memproses login: ..." }` |
| Sesi tidak ditemukan / kedaluwarsa | `401 { success: false, session: null, user: null }` |
| Token cookie tidak ada | `auth()` mengembalikan `null` (tidak throw) |

---

## Keamanan

- ✅ `passwordHash` **tidak pernah dikembalikan** ke client di semua endpoint
- ✅ Cookie di-set dengan `HttpOnly`, `SameSite=Lax`, `Path=/`
- ✅ Session token di-generate menggunakan `crypto.randomBytes(32)` (64 hex chars)
- ✅ Semua error fallback mengembalikan pesan generik (bukan stack trace)
