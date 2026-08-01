import { DatabaseAdapter, verifyPassword, hashPassword, generateSessionToken, User, Session } from "@mikulogin/core";

export interface MikuloginConfig {
  adapter: DatabaseAdapter;
  secret: string;
  sessionMaxAge?: number; // default 24 jam (86400 detik)
}

export function mikulogin(config: MikuloginConfig) {
  const maxAge = config.sessionMaxAge || 86400;

  const auth = async (tokenOrCookieHeader?: string): Promise<{ user: User; session: Session } | null> => {
    try {
      if (!tokenOrCookieHeader) return null;
      const match = tokenOrCookieHeader.match(/(?:^|;\s*)mikulogin_session=([^;]+)/);
      const token = match ? match[1].trim() : tokenOrCookieHeader.trim();

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
  };

  return {
    async handleLogin(req: Request): Promise<Response> {
      try {
        let body: any;
        try {
          body = await req.json();
        } catch {
          return Response.json({ success: false, error: "Format JSON tidak valid" }, { status: 400 });
        }

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
        let body: any;
        try {
          body = await req.json();
        } catch {
          return Response.json({ success: false, error: "Format JSON tidak valid" }, { status: 400 });
        }

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

    async handleSession(req: Request): Promise<Response> {
      try {
        const cookieHeader = req.headers.get("cookie") || undefined;
        const result = await auth(cookieHeader);
        if (!result) {
          return Response.json({ success: false, session: null, user: null }, { status: 401 });
        }
        return Response.json({ success: true, user: result.user, session: result.session }, { status: 200 });
      } catch (error) {
        return Response.json({ success: false, session: null, user: null }, { status: 401 });
      }
    },

    auth,
  };
}
