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
| `packages/nextjs` | **`@mikulogin/nextjs`** | Route Handlers, React UI Components (`<SignIn />`, `<SignUp />`, `<ForgotPassword />`, `<ResetPassword />`), dan Auth Helper untuk Next.js | [![npm](https://img.shields.io/npm/v/@mikulogin/nextjs.svg)](https://www.npmjs.com/package/@mikulogin/nextjs) |

---

## 🚀 Panduan Penggunaan (Quick Start)

### Cara 1: Komponen React (`<SignIn />`, `<SignUp />`, `<ForgotPassword />`, `<ResetPassword />`)

Mikulogin menyediakan komponen UI siap pakai untuk alur masuk, pendaftaran, dan reset kata sandi.

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
        forgotPasswordUrl="/forgot-password"
        redirectTo="/dashboard"
      />
    </main>
  );
}
```

```tsx
// app/forgot-password/page.tsx
"use client";
import { ForgotPassword } from "mikulogin";

export default function ForgotPasswordPage() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa" }}>
      <ForgotPassword
        forgotPasswordApiUrl="/api/auth/forgot-password"
        signInUrl="/login"
      />
    </main>
  );
}
```

```tsx
// app/reset-password/page.tsx
"use client";
import { ResetPassword } from "mikulogin";

export default function ResetPasswordPage() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa" }}>
      <ResetPassword
        resetPasswordApiUrl="/api/auth/reset-password"
        signInUrl="/login"
      />
    </main>
  );
}
```

### Cara 2: Route Handlers Next.js (API)

```typescript
// app/api/auth/forgot-password/route.ts
import { PrismaClient } from "@prisma/client";
import { mikulogin, PrismaAdapter } from "mikulogin";

const adapter = PrismaAdapter(new PrismaClient());
const { handleForgotPassword } = mikulogin({
  adapter,
  secret: process.env.AUTH_SECRET!,
  sendPasswordResetEmail: async (email, resetUrl) => {
    // Panggil provider email Anda (Resend, SendGrid, Nodemailer)
    console.log(`Sending reset link to ${email}: ${resetUrl}`);
  },
});

export const POST = (req: Request) => handleForgotPassword(req);
```

```typescript
// app/api/auth/reset-password/route.ts
import { PrismaClient } from "@prisma/client";
import { mikulogin, PrismaAdapter } from "mikulogin";

const adapter = PrismaAdapter(new PrismaClient());
const { handleResetPassword } = mikulogin({
  adapter,
  secret: process.env.AUTH_SECRET!,
});

export const POST = (req: Request) => handleResetPassword(req);
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

### `<ForgotPassword />`

| Prop | Tipe | Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `theme` | `"light" \| "dark"` | `"light"` | Tema UI (`light` atau `dark`) |
| `forgotPasswordApiUrl` | `string` | `"/api/auth/forgot-password"` | Endpoint API lupa password |
| `signInUrl` | `string` | `"/login"` | URL halaman login |
| `title` | `string` | `"Reset Kata Sandi"` | Judul halaman |

### `<ResetPassword />`

| Prop | Tipe | Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `theme` | `"light" \| "dark"` | `"light"` | Tema UI (`light` atau `dark`) |
| `resetPasswordApiUrl` | `string` | `"/api/auth/reset-password"` | Endpoint API reset password |
| `signInUrl` | `string` | `"/login"` | URL halaman login setelah sukses |
| `title` | `string` | `"Buat Kata Sandi Baru"` | Judul halaman |

---

## 🗄️ Konfigurasi Database (Prisma)

Tambahkan model berikut ke `prisma/schema.prisma` Anda:

```prisma
model User {
  id                  String               @id @default(uuid())
  email               String               @unique
  name                String?
  passwordHash        String
  sessions            Session[]
  passwordResetTokens PasswordResetToken[]
  createdAt           DateTime             @default(now())
}

model Session {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model PasswordResetToken {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime
}
```

---

## 🧪 Jalankan Pengujian (Testing)

Proyek ini menggunakan **Vitest** untuk unit test dan pengujian integrasi PostgreSQL riil (*No Fake Mocks*):

```bash
# Jalankan seluruh pengujian
npx vitest run
```

**Test Suite saat ini: 6 file test, 52 tests — 100% PASS**

---

## 📖 Dokumentasi Lengkap Proyek

Dokumentasi detail dari tiap komponen tersedia di folder `docs/documentation-project/`:

- 📘 [Indeks Dokumentasi Proyek](docs/documentation-project/index.md)
- 📘 [Dokumentasi Modul Core (@mikulogin/core)](docs/documentation-project/core-feature.md)
- 📘 [Dokumentasi Adapter Prisma (@mikulogin/adapter-prisma)](docs/documentation-project/adapter-prisma-feature.md)
- 📘 [Dokumentasi Next.js & React UI (@mikulogin/nextjs)](docs/documentation-project/nextjs-feature.md)
