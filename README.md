# Mikulogin 🔐

Framework autentikasi Next.js & Node.js modular dengan arsitektur **Bring Your Own Database (BYOD)**.

Mikulogin memisahkan logika inti otentikasi (token & hashing) dari layer persistensi data (database adapter), sehingga Anda memiliki kendali penuh atas skema dan tempat penyimpanan data pengguna Anda.

---

## ⚡ Instalasi Cepat (Quick Install)

Anda dapat langsung menginstal paket utama **`mikulogin`**:

```bash
npm install mikulogin @prisma/client bcryptjs react react-dom
```

Atau jika ingin menginstal paket modularnya secara terpisah:

```bash
npm install @mikulogin/core @mikulogin/adapter-prisma @mikulogin/nextjs @prisma/client bcryptjs react react-dom
```

---

## 📦 Paket Monorepo Resmi di NPM

| Paket | Nama Package di NPM | Fungsi | NPM Link |
| :--- | :--- | :--- | :--- |
| `packages/mikulogin` | **`mikulogin`** | Paket utama (Umbrella package) yang meng-ekspor ulang core, adapter & nextjs | [![npm](https://img.shields.io/npm/v/mikulogin.svg)](https://www.npmjs.com/package/mikulogin) |
| `packages/core` | **`@mikulogin/core`** | Tipe data inti (`User`, `Session`, `DatabaseAdapter`) & utilitas kriptografi | [![npm](https://img.shields.io/npm/v/@mikulogin/core.svg)](https://www.npmjs.com/package/@mikulogin/core) |
| `packages/adapter-prisma` | **`@mikulogin/adapter-prisma`** | Implementasi `DatabaseAdapter` untuk Prisma ORM (PostgreSQL) | [![npm](https://img.shields.io/npm/v/@mikulogin/adapter-prisma.svg)](https://www.npmjs.com/package/@mikulogin/adapter-prisma) |
| `packages/nextjs` | **`@mikulogin/nextjs`** | Route Handlers, React UI Components (`<SignIn />`, `<SignUp />`), dan Auth Helper untuk Next.js | [![npm](https://img.shields.io/npm/v/@mikulogin/nextjs.svg)](https://www.npmjs.com/package/@mikulogin/nextjs) |

---

## 🚀 Panduan Penggunaan (Quick Start)

### Cara 1: Komponen React `<SignIn />` & `<SignUp />`

Mikulogin menyediakan komponen UI siap pakai untuk halaman login dan registrasi.

```tsx
// app/login/page.tsx
"use client";
import { SignIn } from "mikulogin";

export default function LoginPage() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa" }}>
      <SignIn
        loginApiUrl="/api/auth/login"
        signUpUrl="/register"
        redirectTo="/dashboard"
      />
    </main>
  );
}
```

```tsx
// app/register/page.tsx
"use client";
import { SignUp } from "mikulogin";

export default function RegisterPage() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa" }}>
      <SignUp
        registerApiUrl="/api/auth/register"
        signInUrl="/login"
      />
    </main>
  );
}
```

### Cara 2: Route Handlers Next.js (API)

```typescript
// app/api/auth/login/route.ts
import { PrismaClient } from "@prisma/client";
import { mikulogin, PrismaAdapter } from "mikulogin";

const adapter = PrismaAdapter(new PrismaClient());
const { handleLogin } = mikulogin({
  adapter,
  secret: process.env.AUTH_SECRET!,
});

export const POST = (req: Request) => handleLogin(req);
```

```typescript
// app/api/auth/register/route.ts
import { PrismaClient } from "@prisma/client";
import { mikulogin, PrismaAdapter } from "mikulogin";

const adapter = PrismaAdapter(new PrismaClient());
const { handleRegister } = mikulogin({
  adapter,
  secret: process.env.AUTH_SECRET!,
});

export const POST = (req: Request) => handleRegister(req);
```

```typescript
// app/api/auth/session/route.ts
import { PrismaClient } from "@prisma/client";
import { mikulogin, PrismaAdapter } from "mikulogin";

const adapter = PrismaAdapter(new PrismaClient());
const { handleSession } = mikulogin({
  adapter,
  secret: process.env.AUTH_SECRET!,
});

export const GET = (req: Request) => handleSession(req);
```

### Cara 3: Auth Helper (Server-side / Middleware)

```typescript
import { mikulogin, PrismaAdapter } from "mikulogin";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const adapter = PrismaAdapter(new PrismaClient());
const { auth } = mikulogin({ adapter, secret: process.env.AUTH_SECRET! });

// Di Server Component / Middleware:
const cookieHeader = cookies().toString();
const session = await auth(cookieHeader); // null jika tidak autentik
```

### Cara 4: Manual (Tanpa Next.js)

Semua tipe dan fungsi dapat diimpor langsung dari paket **`mikulogin`**:

```typescript
import { 
  hashPassword, 
  verifyPassword, 
  generateSessionToken, 
  PrismaAdapter 
} from "mikulogin";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const authAdapter = PrismaAdapter(prisma);

// Registrasi Pengguna Baru
async function handleRegister(email: string, plainPassword: string, name: string) {
  const passwordHash = await hashPassword(plainPassword);
  return await authAdapter.createUser({ email, passwordHash, name });
}

// Login Pengguna & Pembuatan Token Sesi
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
```

---

## 🎨 Props Komponen UI

### `<SignIn />`

| Prop | Tipe | Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `theme` | `"light" \| "dark"` | `"light"` | Tema UI (`light` atau `dark` OLED Pitch-Black) |
| `loginApiUrl` | `string` | `"/api/auth/login"` | Endpoint API untuk proses login |
| `redirectTo` | `string` | `"/dashboard"` | URL tujuan setelah berhasil login |
| `signUpUrl` | `string` | `"/register"` | URL halaman pendaftaran |
| `forgotPasswordUrl` | `string` | `"#"` | URL halaman lupa kata sandi |
| `title` | `string` | `"Welcome Back"` | Judul halaman |
| `subtitle` | `string` | `"..."` | Sub-judul halaman |
| `protocolText` | `string` | `"Mikulogin Security Protocol V2.4"` | Teks branding footer |
| `onSuccess` | `(data) => void` | - | Callback setelah berhasil login |

### `<SignUp />`

| Prop | Tipe | Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `theme` | `"light" \| "dark"` | `"light"` | Tema UI (`light` atau `dark` OLED Pitch-Black) |
| `registerApiUrl` | `string` | `"/api/auth/register"` | Endpoint API untuk proses pendaftaran |
| `signInUrl` | `string` | `"/login"` | URL halaman login |
| `title` | `string` | `"Create Account"` | Judul halaman |
| `subtitle` | `string` | `"..."` | Sub-judul halaman |
| `protocolText` | `string` | `"Mikulogin Security Protocol V2.4"` | Teks branding footer |
| `onSuccess` | `(data) => void` | - | Callback setelah berhasil daftar |

---

## 🗄️ Konfigurasi Database (Prisma)

Tambahkan model berikut ke `prisma/schema.prisma` Anda:

```prisma
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  name         String?
  passwordHash String
  sessions     Session[]
  createdAt    DateTime  @default(now())
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

Lalu jalankan:

```bash
npx prisma migrate dev --name init
```

---

## 🧪 Jalankan Pengujian (Testing)

Proyek ini menggunakan **Vitest** untuk unit test dan pengujian integrasi PostgreSQL riil (*No Fake Mocks*):

```bash
# Jalankan seluruh pengujian
npx vitest run
```

**Test Suite saat ini: 6 file test, 36 tests — 100% PASS**

---

## 📖 Dokumentasi Lengkap Proyek

Dokumentasi detail dari tiap komponen tersedia di folder `docs/documentation-project/`:

- 📘 [Indeks Dokumentasi Proyek](docs/documentation-project/index.md)
- 📘 [Dokumentasi Modul Core (@mikulogin/core)](docs/documentation-project/core-feature.md)
- 📘 [Dokumentasi Adapter Prisma (@mikulogin/adapter-prisma)](docs/documentation-project/adapter-prisma-feature.md)
