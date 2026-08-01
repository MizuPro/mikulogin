# Spesifikasi Desain: Lupa Password & Reset Password

## 1. Pendekatan Utama
Kita akan menggunakan **Pendekatan Callback (Inversion of Control)**. `mikulogin` bertanggung jawab menghasilkan token, menyimpannya ke database, dan memvalidasinya. Urusan pengiriman email diserahkan ke *developer* melalui *callback* `sendPasswordResetEmail`.

## 2. Perubahan Skema Database (Prisma)
Akan ditambahkan model baru di `packages/adapter-prisma/prisma/schema.prisma`:
```prisma
model PasswordResetToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## 3. Perubahan Modul Core (`@mikulogin/core`)
Di `packages/core/src/types.ts`, `DatabaseAdapter` akan diperluas dengan:
- `createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void>`
- `consumePasswordResetToken(token: string): Promise<{ userId: string } | null>` (mengembalikan userId dan langsung menghapus token agar token bersifat satu kali pakai).
- Memodifikasi fungsi `updateUserPassword(userId: string, newPasswordHash: string): Promise<void>` (jika belum ada).

## 4. Perubahan Next.js Handler (`@mikulogin/nextjs`)
Di `mikulogin()` config, akan ditambahkan:
- Konfigurasi `sendPasswordResetEmail?: (email: string, resetUrl: string) => Promise<void>`
- `handleForgotPassword(req: Request)`: Mencari user berdasarkan email, membuat token (berlaku misal 2 jam), lalu memanggil `config.sendPasswordResetEmail(user.email, resetUrl)`.
- `handleResetPassword(req: Request)`: Memvalidasi token dari body request, mengenkripsi (*hash*) password baru yang diberikan, dan memperbarui password user di database.

## 5. Komponen UI Baru (`@mikulogin/nextjs`)
- `<ForgotPassword />`: Form dengan satu input email. Menerima props `forgotPasswordApiUrl` dan `signInUrl`.
- `<ResetPassword />`: Form dengan input "Password Baru" dan "Konfirmasi Password Baru". Mengambil token dari URL parameters (misal `?token=abc`). Menerima props `resetPasswordApiUrl` dan `signInUrl`.
