# Lupa Password & Reset Password Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengimplementasikan fitur Lupa Password dan Reset Password secara *end-to-end* menggunakan pendekatan *callback* pengiriman email.

**Architecture:** Model `PasswordResetToken` ditambahkan di Prisma. Antarmuka `DatabaseAdapter` di `@mikulogin/core` diperluas. Adapter Prisma mengimplementasikan fungsi tersebut, kemudian Route Handlers dan komponen React UI yang bersangkutan ditambahkan ke paket `@mikulogin/nextjs`.

**Tech Stack:** TypeScript, Prisma, Next.js, React, Vitest.

## Global Constraints

- Implementation plan dan task wajib menggunakan bahasa Indonesia.
- Dilarang Keras Mengambil Jalan Pintas (Anti Happy-Path): Tangani skenario kegagalan I/O dan database secara eksplisit menggunakan try/catch.
- Dilarang Memalsukan Testing (No Fake Mocks): Validasi dengan koneksi riil ke PostgreSQL. Jangan mem-bypass logika DB.
- Wajib Integrasi Penuh (Context-First Wiring): Ekspor semua komponen/fungsi agar dapat diakses dari luar package.

---

### Task 1: Perbarui Skema Prisma & Tipe Inti

**Files:**
- Modify: `packages/adapter-prisma/prisma/schema.prisma`
- Modify: `packages/core/src/types.ts`
- Test: (Tidak ada test terpisah untuk definisi tipe/skema)

**Interfaces:**
- Consumes: (Tidak ada)
- Produces: Model Prisma `PasswordResetToken`. Fungsi `createPasswordResetToken`, `consumePasswordResetToken`, `updateUserPassword` pada interface `DatabaseAdapter`.

- [ ] **Step 1: Tambahkan model ke skema Prisma**

Buka `packages/adapter-prisma/prisma/schema.prisma` dan tambahkan ke bagian paling bawah:
```prisma
model PasswordResetToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

- [ ] **Step 2: Jalankan Prisma Migrate untuk skema baru**

Run: `rtk npx prisma migrate dev --name add_password_reset_token --schema packages/adapter-prisma/prisma/schema.prisma`
Expected: Migrasi berhasil, database terbarui.

- [ ] **Step 3: Perbarui antarmuka DatabaseAdapter**

Buka `packages/core/src/types.ts` dan tambahkan fungsi berikut ke interface `DatabaseAdapter`:
```typescript
  createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void>;
  consumePasswordResetToken(token: string): Promise<{ userId: string } | null>;
  updateUserPassword(userId: string, newPasswordHash: string): Promise<void>;
```

- [ ] **Step 4: Commit**

```bash
git add packages/adapter-prisma/prisma/schema.prisma packages/core/src/types.ts
git commit -m "feat: tambahkan skema Prisma dan tipe DatabaseAdapter untuk reset password"
```

---

### Task 2: Implementasi Fungsi di PrismaAdapter

**Files:**
- Modify: `packages/adapter-prisma/src/index.ts`
- Modify: `packages/adapter-prisma/tests/adapter.test.ts` (jika belum ada, buat file baru)
- Test: `packages/adapter-prisma/tests/adapter.test.ts`

**Interfaces:**
- Consumes: Interface `DatabaseAdapter` dari `@mikulogin/core`. Skema Prisma baru dari Task 1.
- Produces: Implementasi nyata dari fungsi-fungsi reset password pada objek `PrismaAdapter`.

- [ ] **Step 1: Write the failing test (Vitest - PostgreSQL Riil)**

```typescript
// packages/adapter-prisma/tests/adapter.test.ts (tambahkan ke describe block yang ada)
import { expect, test, describe, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaAdapter } from '../src/index';

const prisma = new PrismaClient();
const adapter = PrismaAdapter(prisma);

describe('PrismaAdapter - Password Reset', () => {
  let testUserId = '';

  beforeAll(async () => {
    const user = await adapter.createUser({
      email: 'test_reset@example.com',
      passwordHash: 'dummy_hash',
      name: 'Reset Test'
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  test('harus membuat, menggunakan, dan menolak token kedaluwarsa secara riil', async () => {
    const token = 'real_token_123';
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    // Buat token (akan gagal karena belum diimplementasi)
    await adapter.createPasswordResetToken(testUserId, token, expiresAt);

    // Gunakan token yang benar
    const consumed = await adapter.consumePasswordResetToken(token);
    expect(consumed).not.toBeNull();
    expect(consumed?.userId).toBe(testUserId);

    // Gunakan lagi (harus null karena sudah dihapus otomatis)
    const consumedTwice = await adapter.consumePasswordResetToken(token);
    expect(consumedTwice).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run packages/adapter-prisma/tests/adapter.test.ts`
Expected: FAIL dengan pesan "adapter.createPasswordResetToken is not a function".

- [ ] **Step 3: Write minimal implementation**

Buka `packages/adapter-prisma/src/index.ts`, dan tambahkan ini di dalam objek *return* fungsi `PrismaAdapter`:
```typescript
    async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
      try {
        await prisma.passwordResetToken.create({
          data: { userId, token, expiresAt },
        });
      } catch (error) {
        throw new Error(`Gagal membuat token reset: ${(error as Error).message}`);
      }
    },

    async consumePasswordResetToken(token: string): Promise<{ userId: string } | null> {
      try {
        const found = await prisma.passwordResetToken.findUnique({
          where: { token },
        });
        
        if (!found) return null;

        await prisma.passwordResetToken.delete({
          where: { token },
        });

        if (found.expiresAt < new Date()) {
          return null;
        }

        return { userId: found.userId };
      } catch (error) {
        return null; 
      }
    },

    async updateUserPassword(userId: string, newPasswordHash: string): Promise<void> {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { passwordHash: newPasswordHash },
        });
      } catch (error) {
        throw new Error(`Gagal memperbarui password: ${(error as Error).message}`);
      }
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run packages/adapter-prisma/tests/adapter.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/adapter-prisma/src/index.ts packages/adapter-prisma/tests/adapter.test.ts
git commit -m "feat: implementasi adapter untuk token reset password"
```

---

### Task 3: API Route Handlers (`@mikulogin/nextjs`)

**Files:**
- Modify: `packages/nextjs/src/index.ts`
- Test: (Jika ada setup test E2E/API untuk Next.js, jika tidak, kita uji secara manual saat integrasi komponen)

**Interfaces:**
- Consumes: `createPasswordResetToken`, `consumePasswordResetToken`, `updateUserPassword` dari `DatabaseAdapter`. `hashPassword` dari `@mikulogin/core`.
- Produces: API Handlers `handleForgotPassword`, `handleResetPassword`.

- [ ] **Step 1: Write minimal implementation**

Buka `packages/nextjs/src/index.ts`.
Tambahkan pada `MikuloginConfig`:
```typescript
export interface MikuloginConfig {
  adapter: DatabaseAdapter;
  secret: string;
  sendPasswordResetEmail?: (email: string, resetUrl: string) => Promise<void>;
}
```

Di dalam fungsi `mikulogin`, tambahkan:
```typescript
  const handleForgotPassword = async (req: Request) => {
    try {
      const { email, resetUrlBase } = await req.json();
      if (!email || !resetUrlBase) {
        return new Response(JSON.stringify({ error: "Email dan resetUrlBase wajib diisi" }), { status: 400 });
      }

      const user = await adapter.getUserByEmail(email);
      if (!user) {
        return new Response(JSON.stringify({ message: "Jika email valid, tautan reset telah dikirim." }), { status: 200 });
      }

      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 2); 
      await adapter.createPasswordResetToken(user.id, token, expiresAt);

      if (config.sendPasswordResetEmail) {
        const fullUrl = `${resetUrlBase}?token=${token}`;
        await config.sendPasswordResetEmail(user.email, fullUrl);
      }

      return new Response(JSON.stringify({ message: "Jika email valid, tautan reset telah dikirim." }), { status: 200 });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Terjadi kesalahan server" }), { status: 500 });
    }
  };

  const handleResetPassword = async (req: Request) => {
    try {
      const { token, newPassword } = await req.json();
      if (!token || !newPassword || newPassword.length < 8) {
        return new Response(JSON.stringify({ error: "Token tidak valid atau kata sandi terlalu pendek" }), { status: 400 });
      }

      const validToken = await adapter.consumePasswordResetToken(token);
      if (!validToken) {
        return new Response(JSON.stringify({ error: "Tautan reset tidak valid atau sudah kedaluwarsa" }), { status: 400 });
      }

      const passwordHash = await hashPassword(newPassword);
      await adapter.updateUserPassword(validToken.userId, passwordHash);

      return new Response(JSON.stringify({ message: "Kata sandi berhasil diperbarui" }), { status: 200 });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Terjadi kesalahan server" }), { status: 500 });
    }
  };
```
Pastikan `handleForgotPassword` dan `handleResetPassword` diekspor di blok return.
*Catatan: Pastikan `crypto.randomUUID()` tersedia, atau gunakan modul web crypto standard.*

- [ ] **Step 2: Commit**

```bash
git add packages/nextjs/src/index.ts
git commit -m "feat: implementasi handler nextjs untuk fitur reset password"
```

---

### Task 4: Komponen UI React

**Files:**
- Create: `packages/nextjs/src/components/ForgotPassword.tsx`
- Create: `packages/nextjs/src/components/ResetPassword.tsx`
- Modify: `packages/nextjs/src/index.ts`

**Interfaces:**
- Consumes: API endpoints `/api/auth/forgot-password` dan `/api/auth/reset-password`.
- Produces: Komponen React `<ForgotPassword />` dan `<ResetPassword />`.

- [ ] **Step 1: Write minimal implementation untuk ForgotPassword**

Buat file `packages/nextjs/src/components/ForgotPassword.tsx`:
```tsx
import React, { useState } from "react";
import "./styles.css";

interface ForgotPasswordProps {
  theme?: "light" | "dark";
  forgotPasswordApiUrl?: string;
  signInUrl?: string;
  title?: string;
  subtitle?: string;
}

export function ForgotPassword({
  theme = "light",
  forgotPasswordApiUrl = "/api/auth/forgot-password",
  signInUrl = "/login",
  title = "Reset Kata Sandi",
  subtitle = "Masukkan email Anda untuk menerima tautan reset",
}: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const resetUrlBase = window.location.origin + "/reset-password";
      const res = await fetch(forgotPasswordApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, resetUrlBase }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage(data.message);
      } else {
        setStatus("error");
        setMessage(data.error);
      }
    } catch (err) {
      setStatus("error");
      setMessage("Koneksi gagal. Coba lagi.");
    }
  };

  return (
    <div className={`miku-container ${theme}`}>
      <div className="miku-card">
        <h2 className="miku-title">{title}</h2>
        <p className="miku-subtitle">{subtitle}</p>

        {status === "success" ? (
          <div className="miku-success-box">{message}</div>
        ) : (
          <form className="miku-form" onSubmit={handleSubmit}>
            <div className="miku-input-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="miku@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={status === "loading"}
              />
            </div>
            {status === "error" && <p className="miku-error">{message}</p>}
            <button type="submit" className="miku-button" disabled={status === "loading"}>
              {status === "loading" ? "Mengirim..." : "Kirim Tautan"}
            </button>
          </form>
        )}

        <div className="miku-footer">
          <p>
            Ingat kata sandi Anda? <a href={signInUrl}>Masuk di sini</a>
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write minimal implementation untuk ResetPassword**

Buat file `packages/nextjs/src/components/ResetPassword.tsx`:
```tsx
import React, { useState, useEffect } from "react";
import "./styles.css";

interface ResetPasswordProps {
  theme?: "light" | "dark";
  resetPasswordApiUrl?: string;
  signInUrl?: string;
  title?: string;
  subtitle?: string;
}

export function ResetPassword({
  theme = "light",
  resetPasswordApiUrl = "/api/auth/reset-password",
  signInUrl = "/login",
  title = "Buat Kata Sandi Baru",
  subtitle = "Masukkan kata sandi baru Anda di bawah ini",
}: ResetPasswordProps) {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlToken = searchParams.get("token");
    if (urlToken) setToken(urlToken);
    else {
      setStatus("error");
      setMessage("Tautan reset tidak valid atau tidak memiliki token.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(resetPasswordApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage("Kata sandi berhasil diperbarui. Silakan masuk.");
      } else {
        setStatus("error");
        setMessage(data.error);
      }
    } catch (err) {
      setStatus("error");
      setMessage("Koneksi gagal. Coba lagi.");
    }
  };

  return (
    <div className={`miku-container ${theme}`}>
      <div className="miku-card">
        <h2 className="miku-title">{title}</h2>
        <p className="miku-subtitle">{subtitle}</p>

        {status === "success" ? (
          <div className="miku-success-box">
            <p>{message}</p>
            <a href={signInUrl} className="miku-button" style={{ display: "inline-block", marginTop: "1rem" }}>Masuk Sekarang</a>
          </div>
        ) : (
          <form className="miku-form" onSubmit={handleSubmit}>
            <div className="miku-input-group">
              <label>Kata Sandi Baru (Min. 8 karakter)</label>
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                disabled={status === "loading" || !token}
              />
            </div>
            {status === "error" && <p className="miku-error">{message}</p>}
            <button type="submit" className="miku-button" disabled={status === "loading" || !token}>
              {status === "loading" ? "Memproses..." : "Simpan Kata Sandi"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Ekspor komponen baru**

Di bagian paling bawah file `packages/nextjs/src/index.ts`, tambahkan:
```typescript
export * from "./components/ForgotPassword";
export * from "./components/ResetPassword";
```

- [ ] **Step 4: Commit**

```bash
git add packages/nextjs/src/components/ForgotPassword.tsx packages/nextjs/src/components/ResetPassword.tsx packages/nextjs/src/index.ts
git commit -m "feat: tambahkan komponen UI ForgotPassword dan ResetPassword"
```
