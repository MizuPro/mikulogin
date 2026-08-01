import { expect, test, vi, describe } from "vitest";
import { mikulogin } from "../src/handlers";
import type { DatabaseAdapter, User, Session } from "@mikulogin/core";
import { hashPassword } from "@mikulogin/core";

// Mock DatabaseAdapter yang merepresentasikan integrasi database sungguhan untuk pengujian unit
const createMockAdapter = (hashedPassword: string): DatabaseAdapter => {
  const users: User[] = [
    {
      id: "user_1",
      email: "test@example.com",
      passwordHash: hashedPassword,
      name: "Tester",
      createdAt: new Date(),
    },
  ];

  const sessions: Session[] = [
    {
      id: "sess_1",
      userId: "user_1",
      token: "valid_token",
      expiresAt: new Date(Date.now() + 3600000), // 1 jam dari sekarang
    },
    {
      id: "sess_expired",
      userId: "user_1",
      token: "expired_token",
      expiresAt: new Date(Date.now() - 3600000), // 1 jam yang lalu (kadaluarsa)
    },
  ];

  const resetTokens: Array<{ userId: string; token: string; expiresAt: Date }> = [
    {
      userId: "user_1",
      token: "valid_reset_token",
      expiresAt: new Date(Date.now() + 3600000),
    },
    {
      userId: "user_1",
      token: "expired_reset_token",
      expiresAt: new Date(Date.now() - 3600000),
    },
  ];

  return {
    async getUserByEmail(email: string): Promise<User | null> {
      if (email === "error@example.com") {
        throw new Error("Koneksi database terputus");
      }
      const found = users.find((u) => u.email === email);
      return found || null;
    },
    async createUser(data: Omit<User, "id" | "createdAt">): Promise<User> {
      if (data.email === "error_create@example.com") {
        throw new Error("Gagal menyimpan ke database");
      }
      const newUser: User = {
        id: `user_${users.length + 1}`,
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name ?? null,
        createdAt: new Date(),
      };
      users.push(newUser);
      return newUser;
    },
    async createSession(userId: string, token: string, expiresAt: Date): Promise<Session> {
      const newSession: Session = {
        id: `sess_${sessions.length + 1}`,
        userId,
        token,
        expiresAt,
      };
      sessions.push(newSession);
      return newSession;
    },
    async getSessionAndUser(token: string): Promise<{ session: Session; user: User } | null> {
      if (token === "error_token") {
        throw new Error("Gagal mengambil session dari database");
      }
      const session = sessions.find((s) => s.token === token);
      if (!session) return null;
      const user = users.find((u) => u.id === session.userId);
      if (!user) return null;
      return { session, user };
    },
    async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
      if (userId === "error_user") {
        throw new Error("Gagal membuat token reset di DB");
      }
      resetTokens.push({ userId, token, expiresAt });
    },
    async consumePasswordResetToken(token: string): Promise<{ userId: string } | null> {
      if (token === "error_token") {
        throw new Error("Gagal mengonsumsi token di DB");
      }
      const index = resetTokens.findIndex((t) => t.token === token);
      if (index === -1) return null;
      const found = resetTokens[index];
      resetTokens.splice(index, 1);
      if (found.expiresAt < new Date()) return null;
      return { userId: found.userId };
    },
    async updateUserPassword(userId: string, newPasswordHash: string): Promise<void> {
      if (userId === "error_update_pass") {
        throw new Error("Gagal update password di DB");
      }
      const user = users.find((u) => u.id === userId);
      if (user) {
        user.passwordHash = newPasswordHash;
      }
    },
  };
};

describe("Mikulogin Next.js Server Route Handlers dan Cookie Session Helper", () => {
  test("Route Handlers: mikulogin membuat handler valid", async () => {
    const hashedPassword = await hashPassword("password123");
    const adapter = createMockAdapter(hashedPassword);
    const authObj = mikulogin({ adapter, secret: "supersecret" });
    expect(typeof authObj.handleLogin).toBe("function");
    expect(typeof authObj.handleRegister).toBe("function");
    expect(typeof authObj.handleSession).toBe("function");
    expect(typeof authObj.handleForgotPassword).toBe("function");
    expect(typeof authObj.handleResetPassword).toBe("function");
    expect(typeof authObj.auth).toBe("function");
  });

  describe("handleLogin", () => {
    test("mengembalikan error 400 jika format JSON malformed / tidak valid", async () => {
      const hashedPassword = await hashPassword("password123");
      const adapter = createMockAdapter(hashedPassword);
      const { handleLogin } = mikulogin({ adapter, secret: "supersecret" });

      const req = new Request("http://localhost/api/login", {
        method: "POST",
        body: "{ invalid json format",
        headers: { "Content-Type": "application/json" },
      });
      const res = await handleLogin(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("Format JSON tidak valid");
    });

    test("mengembalikan error 400 jika email atau password tidak diisi", async () => {
      const hashedPassword = await hashPassword("password123");
      const adapter = createMockAdapter(hashedPassword);
      const { handleLogin } = mikulogin({ adapter, secret: "supersecret" });

      const req1 = new Request("http://localhost/api/login", {
        method: "POST",
        body: JSON.stringify({ email: "" }),
      });
      const res1 = await handleLogin(req1);
      expect(res1.status).toBe(400);
      const data1 = await res1.json();
      expect(data1.success).toBe(false);
      expect(data1.error).toContain("Email dan password wajib diisi");
    });

    test("mengembalikan error 401 jika user tidak ditemukan atau password salah", async () => {
      const hashedPassword = await hashPassword("password123");
      const adapter = createMockAdapter(hashedPassword);
      const { handleLogin } = mikulogin({ adapter, secret: "supersecret" });

      // User tidak ditemukan
      const reqNotFound = new Request("http://localhost/api/login", {
        method: "POST",
        body: JSON.stringify({ email: "unknown@example.com", password: "password123" }),
      });
      const resNotFound = await handleLogin(reqNotFound);
      expect(resNotFound.status).toBe(401);

      // Password salah
      const reqWrongPass = new Request("http://localhost/api/login", {
        method: "POST",
        body: JSON.stringify({ email: "test@example.com", password: "wrongpassword" }),
      });
      const resWrongPass = await handleLogin(reqWrongPass);
      expect(resWrongPass.status).toBe(401);
    });

    test("berhasil login dan membuat cookie session (Set-Cookie)", async () => {
      const hashedPassword = await hashPassword("password123");
      const adapter = createMockAdapter(hashedPassword);
      const { handleLogin } = mikulogin({ adapter, secret: "supersecret" });

      const req = new Request("http://localhost/api/login", {
        method: "POST",
        body: JSON.stringify({ email: "test@example.com", password: "password123" }),
      });
      const res = await handleLogin(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.user.email).toBe("test@example.com");

      const setCookie = res.headers.get("Set-Cookie");
      expect(setCookie).toBeTruthy();
      expect(setCookie).toContain("mikulogin_session=");
      expect(setCookie).toContain("HttpOnly");
      expect(setCookie).toContain("Max-Age=86400");
    });

    test("berhasil login dengan opsi rememberMe=true dan mengeset Max-Age=2592000 (30 hari)", async () => {
      const hashedPassword = await hashPassword("password123");
      const adapter = createMockAdapter(hashedPassword);
      const { handleLogin } = mikulogin({ adapter, secret: "supersecret" });

      const req = new Request("http://localhost/api/login", {
        method: "POST",
        body: JSON.stringify({ email: "test@example.com", password: "password123", rememberMe: true }),
      });
      const res = await handleLogin(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      const setCookie = res.headers.get("Set-Cookie");
      expect(setCookie).toBeTruthy();
      expect(setCookie).toContain("Max-Age=2592000");
    });

    test("menangani error internal/database secara eksplisit (500)", async () => {
      const hashedPassword = await hashPassword("password123");
      const adapter = createMockAdapter(hashedPassword);
      const { handleLogin } = mikulogin({ adapter, secret: "supersecret" });

      const req = new Request("http://localhost/api/login", {
        method: "POST",
        body: JSON.stringify({ email: "error@example.com", password: "password123" }),
      });
      const res = await handleLogin(req);
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("Gagal memproses login");
    });
  });

  describe("handleRegister", () => {
    test("mengembalikan error 400 jika format JSON malformed / tidak valid", async () => {
      const hashedPassword = await hashPassword("password123");
      const adapter = createMockAdapter(hashedPassword);
      const { handleRegister } = mikulogin({ adapter, secret: "supersecret" });

      const req = new Request("http://localhost/api/register", {
        method: "POST",
        body: "{ malformed json",
        headers: { "Content-Type": "application/json" },
      });
      const res = await handleRegister(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("Format JSON tidak valid");
    });

    test("mengembalikan error 400 jika email atau password tidak diisi", async () => {
      const hashedPassword = await hashPassword("password123");
      const adapter = createMockAdapter(hashedPassword);
      const { handleRegister } = mikulogin({ adapter, secret: "supersecret" });

      const req = new Request("http://localhost/api/register", {
        method: "POST",
        body: JSON.stringify({ email: "new@example.com" }),
      });
      const res = await handleRegister(req);
      expect(res.status).toBe(400);
    });

    test("mengembalikan error 400 jika email sudah terdaftar", async () => {
      const hashedPassword = await hashPassword("password123");
      const adapter = createMockAdapter(hashedPassword);
      const { handleRegister } = mikulogin({ adapter, secret: "supersecret" });

      const req = new Request("http://localhost/api/register", {
        method: "POST",
        body: JSON.stringify({ email: "test@example.com", password: "password123" }),
      });
      const res = await handleRegister(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Email sudah terdaftar");
    });

    test("berhasil registrasi user baru (201)", async () => {
      const hashedPassword = await hashPassword("password123");
      const adapter = createMockAdapter(hashedPassword);
      const { handleRegister } = mikulogin({ adapter, secret: "supersecret" });

      const req = new Request("http://localhost/api/register", {
        method: "POST",
        body: JSON.stringify({ email: "newuser@example.com", password: "password123", name: "Pengguna Baru" }),
      });
      const res = await handleRegister(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.user.email).toBe("newuser@example.com");
      expect(data.user.name).toBe("Pengguna Baru");
    });

    test("menangani error internal/database saat registrasi (500)", async () => {
      const hashedPassword = await hashPassword("password123");
      const adapter = createMockAdapter(hashedPassword);
      const { handleRegister } = mikulogin({ adapter, secret: "supersecret" });

      const req = new Request("http://localhost/api/register", {
        method: "POST",
        body: JSON.stringify({ email: "error_create@example.com", password: "password123" }),
      });
      const res = await handleRegister(req);
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("Gagal membuat akun");
    });
  });

  describe("handleSession", () => {
    test("mengembalikan 200 OK dengan user (tanpa passwordHash) dan session jika cookie valid", async () => {
      const hashedPassword = await hashPassword("password123");
      const adapter = createMockAdapter(hashedPassword);
      const { handleSession } = mikulogin({ adapter, secret: "supersecret" });

      const req = new Request("http://localhost/api/session", {
        method: "GET",
        headers: { Cookie: "mikulogin_session=valid_token" },
      });
      const res = await handleSession(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.user.email).toBe("test@example.com");
      expect(data.user.passwordHash).toBeUndefined();
      expect(data.session.token).toBe("valid_token");
    });

    test("mengembalikan 401 Unauthorized dengan session null jika cookie tidak valid atau tidak ada", async () => {
      const hashedPassword = await hashPassword("password123");
      const adapter = createMockAdapter(hashedPassword);
      const { handleSession } = mikulogin({ adapter, secret: "supersecret" });

      const reqMissing = new Request("http://localhost/api/session", {
        method: "GET",
      });
      const resMissing = await handleSession(reqMissing);
      expect(resMissing.status).toBe(401);
      const dataMissing = await resMissing.json();
      expect(dataMissing.success).toBe(false);
      expect(dataMissing.session).toBeNull();
      expect(dataMissing.user).toBeNull();

      const reqExpired = new Request("http://localhost/api/session", {
        method: "GET",
        headers: { Cookie: "mikulogin_session=expired_token" },
      });
      const resExpired = await handleSession(reqExpired);
      expect(resExpired.status).toBe(401);
      const dataExpired = await resExpired.json();
      expect(dataExpired.success).toBe(false);
      expect(dataExpired.session).toBeNull();
      expect(dataExpired.user).toBeNull();
    });
  });

  describe("auth cookie helper", () => {
    test("mengembalikan null jika token atau header cookie kosong/invalid", async () => {
      const hashedPassword = await hashPassword("password123");
      const adapter = createMockAdapter(hashedPassword);
      const { auth } = mikulogin({ adapter, secret: "supersecret" });

      expect(await auth()).toBeNull();
      expect(await auth("")).toBeNull();
      expect(await auth("invalid_token")).toBeNull();
    });

    test("berhasil memverifikasi session dari string token maupun header cookie dengan regex presisi", async () => {
      const hashedPassword = await hashPassword("password123");
      const adapter = createMockAdapter(hashedPassword);
      const { auth } = mikulogin({ adapter, secret: "supersecret" });

      // Verifikasi token mentah
      const resultRaw = await auth("valid_token");
      expect(resultRaw).not.toBeNull();
      expect(resultRaw?.user.email).toBe("test@example.com");

      // Verifikasi Cookie header biasa
      const cookieHeader = "other_cookie=123; mikulogin_session=valid_token; foo=bar";
      const resultCookie = await auth(cookieHeader);
      expect(resultCookie).not.toBeNull();
      expect(resultCookie?.user.email).toBe("test@example.com");

      // Verifikasi Cookie header dengan awalan yang menyerupai nama cookie lain
      const trickCookieHeader = "other_mikulogin_session=invalid_token; mikulogin_session=valid_token; bar=baz";
      const resultTrick = await auth(trickCookieHeader);
      expect(resultTrick).not.toBeNull();
      expect(resultTrick?.user.email).toBe("test@example.com");
    });

    test("mengembalikan null jika session sudah kadaluarsa (expired)", async () => {
      const hashedPassword = await hashPassword("password123");
      const adapter = createMockAdapter(hashedPassword);
      const { auth } = mikulogin({ adapter, secret: "supersecret" });

      const result = await auth("expired_token");
      expect(result).toBeNull();
    });

    test("mengembalikan null secara aman jika terjadi error internal saat auth", async () => {
      const hashedPassword = await hashPassword("password123");
      const adapter = createMockAdapter(hashedPassword);
      const { auth } = mikulogin({ adapter, secret: "supersecret" });

      const result = await auth("error_token");
      expect(result).toBeNull();
    });
  });

  describe("handleForgotPassword", () => {
    test("mengembalikan error 400 jika format JSON malformed / tidak valid", async () => {
      const hashedPassword = await hashPassword("password123");
      const adapter = createMockAdapter(hashedPassword);
      const { handleForgotPassword } = mikulogin({ adapter, secret: "supersecret" });

      const req = new Request("http://localhost/api/forgot-password", {
        method: "POST",
        body: "{ malformed json",
        headers: { "Content-Type": "application/json" },
      });
      const res = await handleForgotPassword(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Format JSON tidak valid");
    });

    test("mengembalikan error 400 jika email atau resetUrlBase tidak diisi", async () => {
      const hashedPassword = await hashPassword("password123");
      const adapter = createMockAdapter(hashedPassword);
      const { handleForgotPassword } = mikulogin({ adapter, secret: "supersecret" });

      const req1 = new Request("http://localhost/api/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: "" }),
      });
      const res1 = await handleForgotPassword(req1);
      expect(res1.status).toBe(400);
      const data1 = await res1.json();
      expect(data1.error).toContain("Email dan resetUrlBase wajib diisi");

      const req2 = new Request("http://localhost/api/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: "test@example.com" }),
      });
      const res2 = await handleForgotPassword(req2);
      expect(res2.status).toBe(400);
      const data2 = await res2.json();
      expect(data2.error).toContain("Email dan resetUrlBase wajib diisi");
    });

    test("mengembalikan status 200 dengan pesan aman jika email tidak ditemukan", async () => {
      const hashedPassword = await hashPassword("password123");
      const adapter = createMockAdapter(hashedPassword);
      const { handleForgotPassword } = mikulogin({ adapter, secret: "supersecret" });

      const req = new Request("http://localhost/api/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: "nonexistent@example.com", resetUrlBase: "http://localhost/reset" }),
      });
      const res = await handleForgotPassword(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message).toContain("Jika email valid, tautan reset telah dikirim.");
    });

    test("berhasil membuat token reset dan memanggil callback sendPasswordResetEmail", async () => {
      const hashedPassword = await hashPassword("password123");
      const adapter = createMockAdapter(hashedPassword);
      const sendEmailMock = vi.fn().mockResolvedValue(undefined);
      const { handleForgotPassword } = mikulogin({
        adapter,
        secret: "supersecret",
        sendPasswordResetEmail: sendEmailMock,
      });

      const req = new Request("http://localhost/api/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: "test@example.com", resetUrlBase: "http://localhost/reset" }),
      });
      const res = await handleForgotPassword(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message).toContain("Jika email valid, tautan reset telah dikirim.");
      expect(sendEmailMock).toHaveBeenCalledTimes(1);
      expect(sendEmailMock.mock.calls[0][0]).toBe("test@example.com");
      expect(sendEmailMock.mock.calls[0][1]).toContain("http://localhost/reset?token=");
    });

    test("menangani error internal/database secara eksplisit (500)", async () => {
      const hashedPassword = await hashPassword("password123");
      const adapter = createMockAdapter(hashedPassword);
      const { handleForgotPassword } = mikulogin({ adapter, secret: "supersecret" });

      const req = new Request("http://localhost/api/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: "error@example.com", resetUrlBase: "http://localhost/reset" }),
      });
      const res = await handleForgotPassword(req);
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toContain("Terjadi kesalahan server");
    });
  });

  describe("handleResetPassword", () => {
    test("mengembalikan error 400 jika format JSON malformed / tidak valid", async () => {
      const hashedPassword = await hashPassword("password123");
      const adapter = createMockAdapter(hashedPassword);
      const { handleResetPassword } = mikulogin({ adapter, secret: "supersecret" });

      const req = new Request("http://localhost/api/reset-password", {
        method: "POST",
        body: "{ invalid json",
        headers: { "Content-Type": "application/json" },
      });
      const res = await handleResetPassword(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Format JSON tidak valid");
    });

    test("mengembalikan error 400 jika token tidak ada atau password kurang dari 8 karakter", async () => {
      const hashedPassword = await hashPassword("password123");
      const adapter = createMockAdapter(hashedPassword);
      const { handleResetPassword } = mikulogin({ adapter, secret: "supersecret" });

      const req1 = new Request("http://localhost/api/reset-password", {
        method: "POST",
        body: JSON.stringify({ token: "", newPassword: "newpassword123" }),
      });
      const res1 = await handleResetPassword(req1);
      expect(res1.status).toBe(400);
      const data1 = await res1.json();
      expect(data1.error).toContain("Token tidak valid atau kata sandi terlalu pendek");

      const req2 = new Request("http://localhost/api/reset-password", {
        method: "POST",
        body: JSON.stringify({ token: "valid_reset_token", newPassword: "short" }),
      });
      const res2 = await handleResetPassword(req2);
      expect(res2.status).toBe(400);
      const data2 = await res2.json();
      expect(data2.error).toContain("Token tidak valid atau kata sandi terlalu pendek");
    });

    test("mengembalikan error 400 jika token reset tidak valid atau sudah kedaluwarsa", async () => {
      const hashedPassword = await hashPassword("password123");
      const adapter = createMockAdapter(hashedPassword);
      const { handleResetPassword } = mikulogin({ adapter, secret: "supersecret" });

      // Token tidak terdaftar
      const reqInvalid = new Request("http://localhost/api/reset-password", {
        method: "POST",
        body: JSON.stringify({ token: "invalid_token_123", newPassword: "newpassword123" }),
      });
      const resInvalid = await handleResetPassword(reqInvalid);
      expect(resInvalid.status).toBe(400);
      const dataInvalid = await resInvalid.json();
      expect(dataInvalid.error).toContain("Tautan reset tidak valid atau sudah kedaluwarsa");

      // Token kedaluwarsa
      const reqExpired = new Request("http://localhost/api/reset-password", {
        method: "POST",
        body: JSON.stringify({ token: "expired_reset_token", newPassword: "newpassword123" }),
      });
      const resExpired = await handleResetPassword(reqExpired);
      expect(resExpired.status).toBe(400);
      const dataExpired = await resExpired.json();
      expect(dataExpired.error).toContain("Tautan reset tidak valid atau sudah kedaluwarsa");
    });

    test("berhasil memperbarui kata sandi dengan token reset valid", async () => {
      const hashedPassword = await hashPassword("password123");
      const adapter = createMockAdapter(hashedPassword);
      const { handleResetPassword, handleLogin } = mikulogin({ adapter, secret: "supersecret" });

      const req = new Request("http://localhost/api/reset-password", {
        method: "POST",
        body: JSON.stringify({ token: "valid_reset_token", newPassword: "newpassword123" }),
      });
      const res = await handleResetPassword(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message).toContain("Kata sandi berhasil diperbarui");

      // Verifikasi bahwa password lama sudah tidak berlaku dan password baru berlaku
      const reqOld = new Request("http://localhost/api/login", {
        method: "POST",
        body: JSON.stringify({ email: "test@example.com", password: "password123" }),
      });
      const resOld = await handleLogin(reqOld);
      expect(resOld.status).toBe(401);

      const reqNew = new Request("http://localhost/api/login", {
        method: "POST",
        body: JSON.stringify({ email: "test@example.com", password: "newpassword123" }),
      });
      const resNew = await handleLogin(reqNew);
      expect(resNew.status).toBe(200);
    });

    test("menangani error internal/database secara eksplisit (500)", async () => {
      const hashedPassword = await hashPassword("password123");
      const adapter = createMockAdapter(hashedPassword);
      const { handleResetPassword } = mikulogin({ adapter, secret: "supersecret" });

      const req = new Request("http://localhost/api/reset-password", {
        method: "POST",
        body: JSON.stringify({ token: "error_token", newPassword: "newpassword123" }),
      });
      const res = await handleResetPassword(req);
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toContain("Terjadi kesalahan server");
    });
  });
});
