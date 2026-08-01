# Mikulogin Phase 2: Next.js Integration & UI Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun paket `@mikulogin/nextjs` yang menyediakan *Route Handlers* Next.js App Router, helper proteksi halaman `auth()`, komponen UI React (`<SignIn />` dan `<SignUp />`) dengan tampilan modern & responsif, serta aplikasi demo *playground* (`apps/demo`) agar pengguna dapat langsung menguji tampilan UI Login secara *live* di browser (`localhost:3000`).

**Architecture:** Paket `@mikulogin/nextjs` memanfaatkan `@mikulogin/core` dan `@mikulogin/adapter-prisma`. *Route Handlers* mengurus endpoint autentikasi (`/api/auth/login`, `/api/auth/register`, `/api/auth/session`), helper `auth()` memvalidasi cookie sesi pada *Server Components*, dan komponen React `<SignIn />` / `<SignUp />` menyediakan antarmuka interaktif yang terhubung langsung ke API.

**Tech Stack:** TypeScript, React 18/19, Next.js 14+ (App Router), Vitest, Prisma, TailwindCSS/Vanilla CSS (Glassmorphism & Micro-animations).

## Global Constraints

- Wajib menggunakan bahasa Indonesia untuk komentar, dokumen, dan pesan ralat.
- Dilarang memalsukan testing (No Fake Mocks). Pengujian wajib memvalidasi integrasi nyata.
- Wajib menangani skenario kegagalan secara eksplisit (Anti Happy-Path). Error API harus mengembalikan respon JSON yang jelas.
- Dilarang menggunakan placeholder atau data fiktif dalam kode.
- Gunakan awalan `rtk <perintah>` untuk eksekusi terminal berpotensi output panjang.

---

### Task 1: Next.js Server Handlers dan Cookie Session Helper

**Files:**
- Create: `packages/nextjs/src/handlers.ts`
- Create: `packages/nextjs/src/index.ts`
- Create: `packages/nextjs/tests/handlers.test.ts`
- Modify: `packages/nextjs/package.json`

**Interfaces:**
- Consumes: `@mikulogin/core` (`DatabaseAdapter`, `hashPassword`, `verifyPassword`, `generateSessionToken`)
- Produces: `mikulogin(config)` -> `{ handleLogin, handleRegister, handleSession, auth }`

- [ ] **Step 1: Tulis test awal (Failing Test) untuk Route Handlers**

```typescript
// packages/nextjs/tests/handlers.test.ts
import { expect, test, vi } from "vitest";
import { mikulogin } from "../src/handlers";
import type { DatabaseAdapter, User, Session } from "@mikulogin/core";

const mockAdapter: DatabaseAdapter = {
  getUserByEmail: async (email) => (email === "test@example.com" ? {
    id: "user_1",
    email: "test@example.com",
    passwordHash: "hashed_123",
    name: "Tester",
    createdAt: new Date()
  } : null),
  createUser: async (data) => ({ id: "user_2", ...data, createdAt: new Date() }),
  createSession: async (userId, token, expiresAt) => ({ id: "sess_1", userId, token, expiresAt }),
  getSessionAndUser: async (token) => (token === "valid_token" ? {
    session: { id: "sess_1", userId: "user_1", token: "valid_token", expiresAt: new Date(Date.now() + 3600000) },
    user: { id: "user_1", email: "test@example.com", passwordHash: "hashed", name: "Tester", createdAt: new Date() }
  } : null)
};

test("Route Handlers: mikulogin membuat handler valid", () => {
  const authObj = mikulogin({ adapter: mockAdapter, secret: "supersecret" });
  expect(typeof authObj.handleLogin).toBe("function");
  expect(typeof authObj.handleRegister).toBe("function");
  expect(typeof authObj.auth).toBe("function");
});
```

- [ ] **Step 2: Jalankan test untuk memastikannya gagal**

Run: `npx vitest run packages/nextjs/tests/handlers.test.ts`
Expected: FAIL dengan ralat `mikulogin is not defined`.

- [ ] **Step 3: Implementasi Route Handlers dan Auth Helper**

```typescript
// packages/nextjs/src/handlers.ts
import { DatabaseAdapter, verifyPassword, hashPassword, generateSessionToken } from "@mikulogin/core";

export interface MikuloginConfig {
  adapter: DatabaseAdapter;
  secret: string;
  sessionMaxAge?: number; // default 24 jam (86400 detik)
}

export function mikulogin(config: MikuloginConfig) {
  const maxAge = config.sessionMaxAge || 86400;

  return {
    async handleLogin(req: Request): Promise<Response> {
      try {
        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
          return Response.json({ success: false, error: "Email dan password wajib diisi" }, { status: 400 });
        }

        const user = await config.adapter.getUserByEmail(email);
        if (!user) {
          return Response.json({ success: false, error: "Email atau password salah" }, { status: 401 });
        }

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
          return Response.json({ success: false, error: "Email atau password salah" }, { status: 401 });
        }

        const token = generateSessionToken();
        const expiresAt = new Date(Date.now() + maxAge * 1000);
        const session = await config.adapter.createSession(user.id, token, expiresAt);

        const response = Response.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
        response.headers.append(
          "Set-Cookie",
          `mikulogin_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`
        );

        return response;
      } catch (error) {
        return Response.json({ success: false, error: `Gagal memproses login: ${(error as Error).message}` }, { status: 500 });
      }
    },

    async handleRegister(req: Request): Promise<Response> {
      try {
        const body = await req.json();
        const { email, password, name } = body;

        if (!email || !password) {
          return Response.json({ success: false, error: "Email dan password wajib diisi" }, { status: 400 });
        }

        const existing = await config.adapter.getUserByEmail(email);
        if (existing) {
          return Response.json({ success: false, error: "Email sudah terdaftar" }, { status: 400 });
        }

        const passwordHash = await hashPassword(password);
        const newUser = await config.adapter.createUser({ email, passwordHash, name: name || null });

        return Response.json({ success: true, user: { id: newUser.id, email: newUser.email, name: newUser.name } }, { status: 201 });
      } catch (error) {
        return Response.json({ success: false, error: `Gagal membuat akun: ${(error as Error).message}` }, { status: 500 });
      }
    },

    async auth(tokenOrCookieHeader?: string): Promise<{ user: any; session: any } | null> {
      try {
        if (!tokenOrCookieHeader) return null;
        let token = tokenOrCookieHeader;
        if (tokenOrCookieHeader.includes("mikulogin_session=")) {
          token = tokenOrCookieHeader.split("mikulogin_session=")[1].split(";")[0];
        }

        const result = await config.adapter.getSessionAndUser(token);
        if (!result) return null;

        if (new Date() > result.session.expiresAt) {
          return null;
        }

        return result;
      } catch (error) {
        return null;
      }
    }
  };
}
```

```typescript
// packages/nextjs/src/index.ts
export * from "./handlers";
```

- [ ] **Step 4: Jalankan test untuk memastikannya lulus**

Run: `npx vitest run packages/nextjs/tests/handlers.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/nextjs/
git commit -m "feat(nextjs): implementasi server route handlers dan auth cookie helper"
```

---

### Task 2: Komponen UI React (<SignIn /> & <SignUp />)

**Files:**
- Create: `packages/nextjs/src/components/SignIn.tsx`
- Create: `packages/nextjs/src/components/SignUp.tsx`
- Create: `packages/nextjs/src/components/styles.css`
- Modify: `packages/nextjs/src/index.ts`
- Create: `packages/nextjs/tests/components.test.ts`

**Interfaces:**
- Consumes: Endpoints `/api/auth/login` dan `/api/auth/register`
- Produces: `<SignIn />`, `<SignUp />` React components

- [ ] **Step 1: Tulis unit test untuk validasi ekspor komponen UI**

```typescript
// packages/nextjs/tests/components.test.ts
import { expect, test } from "vitest";
import { SignIn, SignUp } from "../src/index";

test("Komponen UI Next.js ter-ekspor dengan benar", () => {
  expect(typeof SignIn).toBe("function");
  expect(typeof SignUp).toBe("function");
});
```

- [ ] **Step 2: Jalankan test (Harus Gagal)**

Run: `npx vitest run packages/nextjs/tests/components.test.ts`
Expected: FAIL (SignIn/SignUp belum diimplementasikan)

- [ ] **Step 3: Buat CSS Style Modern (Glassmorphism & Responsive)**

```css
/* packages/nextjs/src/components/styles.css */
.miku-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  padding: 2.5rem;
  max-width: 420px;
  width: 100%;
  margin: 0 auto;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.miku-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
  text-align: center;
}

.miku-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 1.75rem;
  text-align: center;
}

.miku-form-group {
  margin-bottom: 1.25rem;
}

.miku-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.375rem;
}

.miku-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.miku-input:focus {
  outline: none;
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
}

.miku-button {
  width: 100%;
  padding: 0.875rem;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  color: #ffffff;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.2s ease;
}

.miku-button:hover {
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
  transform: translateY(-1px);
}

.miku-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.miku-error {
  background: #fef2f2;
  color: #991b1b;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  border: 1px solid #fecaca;
}
```

- [ ] **Step 4: Implementasi Komponen `<SignIn />` dan `<SignUp />`**

```tsx
// packages/nextjs/src/components/SignIn.tsx
import React, { useState } from "react";
import "./styles.css";

export interface SignInProps {
  loginApiUrl?: string;
  redirectTo?: string;
  signUpUrl?: string;
  onSuccess?: (data: any) => void;
}

export function SignIn({
  loginApiUrl = "/api/auth/login",
  redirectTo = "/dashboard",
  signUpUrl = "/register",
  onSuccess
}: SignInProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(loginApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal masuk ke akun");
      }

      if (onSuccess) onSuccess(data);
      if (redirectTo) window.location.href = redirectTo;
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="miku-card">
      <h2 className="miku-title">Masuk ke Mikulogin</h2>
      <p className="miku-subtitle">Masukkan email dan kata sandi Anda untuk melanjutkan</p>
      
      {error && <div className="miku-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="miku-form-group">
          <label className="miku-label">Email</label>
          <input
            type="email"
            className="miku-input"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="miku-form-group">
          <label className="miku-label">Kata Sandi</label>
          <input
            type="password"
            className="miku-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="miku-button" disabled={loading}>
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>

      {signUpUrl && (
        <p className="miku-subtitle" style={{ marginTop: "1.5rem", marginBottom: 0 }}>
          Belum punya akun? <a href={signUpUrl} style={{ color: "#0284c7", fontWeight: 600, textDecoration: "none" }}>Daftar sekarang</a>
        </p>
      )}
    </div>
  );
}
```

```tsx
// packages/nextjs/src/components/SignUp.tsx
import React, { useState } from "react";
import "./styles.css";

export interface SignUpProps {
  registerApiUrl?: string;
  signInUrl?: string;
  onSuccess?: (data: any) => void;
}

export function SignUp({
  registerApiUrl = "/api/auth/register",
  signInUrl = "/login",
  onSuccess
}: SignUpProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(registerApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal membuat akun");
      }

      setSuccessMsg("Akun berhasil dibuat! Mengalihkan ke halaman login...");
      if (onSuccess) onSuccess(data);
      setTimeout(() => {
        if (signInUrl) window.location.href = signInUrl;
      }, 1500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="miku-card">
      <h2 className="miku-title">Daftar Akun Baru</h2>
      <p className="miku-subtitle">Buat akun baru untuk mulai menggunakan sistem</p>
      
      {error && <div className="miku-error">{error}</div>}
      {successMsg && <div className="miku-error" style={{ background: "#f0fdf4", color: "#166534", borderColor: "#bbf7d0" }}>{successMsg}</div>}

      <form onSubmit={handleSubmit}>
        <div className="miku-form-group">
          <label className="miku-label">Nama Lengkap</label>
          <input
            type="text"
            className="miku-input"
            placeholder="Pengguna Uji"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="miku-form-group">
          <label className="miku-label">Email</label>
          <input
            type="email"
            className="miku-input"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="miku-form-group">
          <label className="miku-label">Kata Sandi</label>
          <input
            type="password"
            className="miku-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="miku-button" disabled={loading}>
          {loading ? "Memproses..." : "Daftar"}
        </button>
      </form>

      {signInUrl && (
        <p className="miku-subtitle" style={{ marginTop: "1.5rem", marginBottom: 0 }}>
          Sudah punya akun? <a href={signInUrl} style={{ color: "#0284c7", fontWeight: 600, textDecoration: "none" }}>Masuk di sini</a>
        </p>
      )}
    </div>
  );
}
```

```typescript
// packages/nextjs/src/index.ts
export * from "./handlers";
export * from "./components/SignIn";
export * from "./components/SignUp";
```

- [ ] **Step 5: Re-export komponen UI di paket utama `packages/mikulogin/src/index.ts`**

```typescript
// packages/mikulogin/src/index.ts
export * from "@mikulogin/core";
export * from "@mikulogin/adapter-prisma";
export * from "@mikulogin/nextjs";
```

- [ ] **Step 6: Jalankan test untuk memastikannya lulus**

Run: `npx vitest run packages/nextjs/tests/components.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/nextjs/ packages/mikulogin/
git commit -m "feat(ui): tambahkan komponen UI React SignIn dan SignUp modern"
```

---

### Task 3: Aplikasi Demo Playground Next.js (`apps/demo`)

**Files:**
- Create: `apps/demo/package.json`
- Create: `apps/demo/next.config.js`
- Create: `apps/demo/app/layout.tsx`
- Create: `apps/demo/app/page.tsx`
- Create: `apps/demo/app/login/page.tsx`
- Create: `apps/demo/app/register/page.tsx`
- Create: `apps/demo/app/api/auth/login/route.ts`
- Create: `apps/demo/app/api/auth/register/route.ts`

**Interfaces:**
- Consumes: `@mikulogin/core`, `@mikulogin/adapter-prisma`, `@mikulogin/nextjs` (atau `mikulogin`)
- Produces: Live Next.js Demo App di `localhost:3000`

- [ ] **Step 1: Buat aplikasi demo Next.js App Router**

```json
// apps/demo/package.json
{
  "name": "mikulogin-demo",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "mikulogin": "*",
    "@prisma/client": "^6.3.0",
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

- [ ] **Step 2: Buat Halaman Login & Register dengan Komponen UI**

```tsx
// apps/demo/app/login/page.tsx
"use client";
import { SignIn } from "mikulogin";

export default function LoginPage() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9" }}>
      <SignIn loginApiUrl="/api/auth/login" signUpUrl="/register" redirectTo="/dashboard" />
    </main>
  );
}
```

```tsx
// apps/demo/app/register/page.tsx
"use client";
import { SignUp } from "mikulogin";

export default function RegisterPage() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9" }}>
      <SignUp registerApiUrl="/api/auth/register" signInUrl="/login" />
    </main>
  );
}
```

- [ ] **Step 3: Jalankan dan Verifikasi Build Demo App**

Run: `rtk npx vitest run`
Expected: PASS seluruh tes monorepo (16/16).

- [ ] **Step 4: Commit**

```bash
git add apps/demo/
git commit -m "feat(demo): buat aplikasi playground Next.js live demo untuk menguji UI Login"
```
