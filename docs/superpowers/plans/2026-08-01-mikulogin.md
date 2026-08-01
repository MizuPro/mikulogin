# Mikulogin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun versi awal `mikulogin`, framework autentikasi Next.js dengan arsitektur Bring Your Own Database (BYOD) yang modular (Core, Adapter, Next.js UI).

**Architecture:** Proyek dipecah dalam struktur monorepo/internal-packages. `core` mengurus token dan hashing, `adapter-prisma` menghubungkan core ke database pengguna, dan `nextjs` menyediakan fungsi pembantu (helper) serta komponen antarmuka React. 

**Tech Stack:** TypeScript, Vitest (untuk unit/integration test), Prisma (ORM), bcryptjs.

## Global Constraints

- Wajib menggunakan bahasa Indonesia untuk komentar, dokumen, dan implementasi plan (aturan `user_global`).
- Dilarang memalsukan testing (No Fake Mocks). Interaksi ke database WAJIB menggunakan koneksi PostgreSQL riil di *integration test*.
- Wajib menangani skenario kegagalan secara eksplisit (Anti Happy-Path). Database `down` harus mengembalikan pesan ralat (*graceful*).
- Dilarang menggunakan *placeholder* atau data fiktif dalam kode.

---

### Task 1: Inisialisasi Proyek dan Tipe Inti (Core Types)

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `packages/core/src/types.ts`
- Create: `packages/core/tests/types.test.ts`

**Interfaces:**
- Produces: `User`, `Session`, `Adapter` interface yang akan digunakan di Task berikutnya.

- [ ] **Step 1: Inisialisasi Struktur dan Dependensi**
```bash
npm init -y
npm install typescript @types/node vitest --save-dev
npx tsc --init
mkdir -p packages/core/src packages/core/tests packages/adapter-prisma/src packages/nextjs/src
```

- [ ] **Step 2: Tulis test awal (Failing Test) untuk validasi tipe data**
```typescript
// packages/core/tests/types.test.ts
import { expect, test } from "vitest";
import { User } from "../src/types";

test("Tipe data User harus memiliki field wajib", () => {
  const user: User = {
    id: "user_123",
    email: "test@example.com",
    passwordHash: "hashed",
    name: "Pengguna Uji",
    createdAt: new Date(),
  };
  expect(user.email).toBe("test@example.com");
});
```

- [ ] **Step 3: Jalankan tes (Harus Gagal)**
Jalankan: `npx vitest run packages/core/tests/types.test.ts`
Ekspektasi: Gagal karena `../src/types` belum ada.

- [ ] **Step 4: Implementasi Tipe Inti**
```typescript
// packages/core/src/types.ts
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string | null;
  createdAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  token: string;
}

export interface DatabaseAdapter {
  getUserByEmail(email: string): Promise<User | null>;
  createUser(data: Omit<User, "id" | "createdAt">): Promise<User>;
  createSession(userId: string, token: string, expiresAt: Date): Promise<Session>;
  getSessionAndUser(token: string): Promise<{ session: Session; user: User } | null>;
}
```

- [ ] **Step 5: Jalankan tes (Harus Lulus)**
Jalankan: `npx vitest run packages/core/tests/types.test.ts`
Ekspektasi: PASS

- [ ] **Step 6: Commit**
```bash
git add package.json tsconfig.json packages/core/
git commit -m "feat(core): inisialisasi proyek dan tipe antarmuka (interface) inti"
```

---

### Task 2: Modul Core - Hashing dan Keamanan

**Files:**
- Create: `packages/core/src/crypto.ts`
- Create: `packages/core/tests/crypto.test.ts`

**Interfaces:**
- Consumes: `dependencies: bcryptjs`
- Produces: `hashPassword(password: string): Promise<string>`, `verifyPassword(password: string, hash: string): Promise<boolean>`, `generateSessionToken(): string`

- [ ] **Step 1: Install Dependensi Kriptografi**
```bash
npm install bcryptjs
npm install @types/bcryptjs --save-dev
```

- [ ] **Step 2: Tulis test awal (Failing Test)**
```typescript
// packages/core/tests/crypto.test.ts
import { expect, test } from "vitest";
import { hashPassword, verifyPassword, generateSessionToken } from "../src/crypto";

test("Kriptografi: Hash dan Verifikasi Password", async () => {
  const plain = "rahasia123";
  const hash = await hashPassword(plain);
  
  expect(hash).not.toBe(plain);
  const isValid = await verifyPassword(plain, hash);
  expect(isValid).toBe(true);
  
  const isInvalid = await verifyPassword("salah", hash);
  expect(isInvalid).toBe(false);
});

test("Kriptografi: Pembuatan Token Sesi", () => {
  const token = generateSessionToken();
  expect(token.length).toBeGreaterThan(20);
});
```

- [ ] **Step 3: Jalankan tes (Harus Gagal)**
Jalankan: `npx vitest run packages/core/tests/crypto.test.ts`
Ekspektasi: Gagal karena modul `crypto.ts` belum dibuat.

- [ ] **Step 4: Implementasi Kriptografi**
```typescript
// packages/core/src/crypto.ts
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSessionToken(): string {
  // Menghasilkan token acak 32 bytes (64 karakter hex)
  return randomBytes(32).toString("hex");
}
```

- [ ] **Step 5: Jalankan tes (Harus Lulus)**
Jalankan: `npx vitest run packages/core/tests/crypto.test.ts`
Ekspektasi: PASS

- [ ] **Step 6: Commit**
```bash
git add package.json packages/core/
git commit -m "feat(core): implementasi fungsi kriptografi dan hashing password"
```

---

### Task 3: Prisma Adapter dengan Real PostgreSQL Test

Sesuai dengan aturan Anti Happy-Path dan No Fake Mocks, kita akan melakukan tes langsung ke database. Kita berasumsi pengguna/pengembang memiliki akses ke server PostgreSQL lokal atau container.

**Files:**
- Create: `packages/adapter-prisma/prisma/schema.prisma`
- Create: `packages/adapter-prisma/src/index.ts`
- Create: `packages/adapter-prisma/tests/adapter.test.ts`

**Interfaces:**
- Consumes: `DatabaseAdapter`, `User`, `Session` dari `@mikulogin/core/src/types`
- Produces: `PrismaAdapter(prismaClient)`

- [ ] **Step 1: Install Dependensi Prisma**
```bash
npm install prisma --save-dev
npm install @prisma/client
npx prisma init
# Sesuaikan .env agar menunjuk ke database testing PostgreSQL riil
# contoh: DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mikulogin_test?schema=public"
```

- [ ] **Step 2: Buat Skema Prisma**
```prisma
// packages/adapter-prisma/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String
  name         String?
  createdAt    DateTime  @default(now())
  sessions     Session[]
}

model Session {
  id        String   @id @default(uuid())
  userId    String
  expiresAt DateTime
  token     String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

- [ ] **Step 3: Dorong Skema ke DB Test**
```bash
npx prisma db push
```

- [ ] **Step 4: Tulis test awal dengan koneksi riil (Failing Test)**
```typescript
// packages/adapter-prisma/tests/adapter.test.ts
import { expect, test, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaAdapter } from "../src/index";

const prisma = new PrismaClient();
const adapter = PrismaAdapter(prisma);

beforeAll(async () => {
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

test("Adapter Database: Operasi User dan Session", async () => {
  // Test 1: Buat User
  const newUser = await adapter.createUser({
    email: "adapter@test.com",
    passwordHash: "dummyhash",
    name: "Tester",
  });
  expect(newUser.email).toBe("adapter@test.com");

  // Test 2: Cari User
  const foundUser = await adapter.getUserByEmail("adapter@test.com");
  expect(foundUser?.id).toBe(newUser.id);

  // Test 3: Buat Session
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 jam
  const session = await adapter.createSession(newUser.id, "token_rahasia_123", expiresAt);
  expect(session.userId).toBe(newUser.id);

  // Test 4: Cari Session
  const sessionData = await adapter.getSessionAndUser("token_rahasia_123");
  expect(sessionData).not.toBeNull();
  expect(sessionData?.user.email).toBe("adapter@test.com");
});

test("Adapter Database: Penanganan Koneksi Putus", async () => {
  // Uji koneksi terputus dengan menggunakan prisma client yang dimatikan
  const badPrisma = new PrismaClient();
  await badPrisma.$disconnect();
  const badAdapter = PrismaAdapter(badPrisma);
  
  try {
    await badAdapter.getUserByEmail("apa@saja.com");
    // Harusnya melempar ralat
    expect(true).toBe(false); 
  } catch (error: any) {
    expect(error.message).toContain("Gagal mengambil data pengguna dari database");
  }
});
```

- [ ] **Step 5: Jalankan tes (Harus Gagal)**
Jalankan: `npx vitest run packages/adapter-prisma/tests/adapter.test.ts`
Ekspektasi: Gagal karena `PrismaAdapter` belum ada.

- [ ] **Step 6: Implementasi Prisma Adapter (Anti Happy-Path)**
```typescript
// packages/adapter-prisma/src/index.ts
import type { PrismaClient } from "@prisma/client";
import type { DatabaseAdapter, User, Session } from "../../core/src/types";

export function PrismaAdapter(prisma: PrismaClient): DatabaseAdapter {
  return {
    async getUserByEmail(email: string): Promise<User | null> {
      try {
        const user = await prisma.user.findUnique({ where: { email } });
        return user;
      } catch (error) {
        throw new Error(`Gagal mengambil data pengguna dari database: ${(error as Error).message}`);
      }
    },
    async createUser(data: Omit<User, "id" | "createdAt">): Promise<User> {
      try {
        const user = await prisma.user.create({ data });
        return user;
      } catch (error) {
        throw new Error(`Gagal membuat data pengguna baru: ${(error as Error).message}`);
      }
    },
    async createSession(userId: string, token: string, expiresAt: Date): Promise<Session> {
      try {
        const session = await prisma.session.create({
          data: { userId, token, expiresAt },
        });
        return session;
      } catch (error) {
        throw new Error(`Gagal menyimpan sesi ke database: ${(error as Error).message}`);
      }
    },
    async getSessionAndUser(token: string): Promise<{ session: Session; user: User } | null> {
      try {
        const session = await prisma.session.findUnique({
          where: { token },
          include: { user: true },
        });
        if (!session) return null;
        
        const { user, ...sessionData } = session;
        return { session: sessionData, user };
      } catch (error) {
        throw new Error(`Gagal memvalidasi sesi dari database: ${(error as Error).message}`);
      }
    }
  };
}
```

- [ ] **Step 7: Jalankan tes (Harus Lulus)**
Jalankan: `npx vitest run packages/adapter-prisma/tests/adapter.test.ts`
Ekspektasi: PASS (pastikan database postgres lokal berjalan).

- [ ] **Step 8: Commit**
```bash
git add packages/adapter-prisma/ package.json package-lock.json prisma/ .env
git commit -m "feat(adapter): implementasi Prisma adapter dengan tes database riil dan graceful error handling"
```
