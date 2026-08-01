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
        const { email, password } = body || {};

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
        await config.adapter.createSession(user.id, token, expiresAt);

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
        const { email, password, name } = body || {};

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
        let token = tokenOrCookieHeader.trim();
        if (token.includes("mikulogin_session=")) {
          const parts = token.split("mikulogin_session=");
          if (parts[1]) {
            token = parts[1].split(";")[0].trim();
          }
        }

        if (!token) return null;

        const result = await config.adapter.getSessionAndUser(token);
        if (!result) return null;

        if (new Date() > new Date(result.session.expiresAt)) {
          return null;
        }

        return result;
      } catch (error) {
        return null;
      }
    },
  };
}
