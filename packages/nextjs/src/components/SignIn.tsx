import React, { useState } from "react";
import "./styles.css";

export interface SignInProps {
  /**
   * Endpoint URL untuk memproses login.
   * Default: "/api/auth/login"
   */
  loginApiUrl?: string;
  /**
   * Halaman tujuan setelah berhasil login.
   * Default: "/dashboard"
   */
  redirectTo?: string;
  /**
   * URL menuju halaman pendaftaran (SignUp).
   * Default: "/register"
   */
  signUpUrl?: string;
  /**
   * Callback yang dipanggil setelah login berhasil.
   */
  onSuccess?: (data: any) => void;
}

/**
 * Komponen UI React SignIn untuk autentikasi masuk Mikulogin.
 */
export function SignIn({
  loginApiUrl = "/api/auth/login",
  redirectTo = "/dashboard",
  signUpUrl = "/register",
  onSuccess,
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

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || !data.success) {
        const errorMsg =
          data?.error ||
          (res.status === 401
            ? "Email atau kata sandi tidak valid"
            : "Terjadi kesalahan saat masuk ke akun. Silakan coba lagi.");
        throw new Error(errorMsg);
      }

      if (onSuccess) {
        onSuccess(data);
      }

      if (redirectTo && typeof window !== "undefined") {
        window.location.href = redirectTo;
      }
    } catch (err) {
      setError((err as Error).message || "Terjadi kesalahan yang tidak terduga.");
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
            disabled={loading}
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
            disabled={loading}
          />
        </div>

        <button type="submit" className="miku-button" disabled={loading}>
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>

      {signUpUrl && (
        <p className="miku-subtitle" style={{ marginTop: "1.5rem", marginBottom: 0 }}>
          Belum punya akun?{" "}
          <a href={signUpUrl} style={{ color: "#0284c7", fontWeight: 600, textDecoration: "none" }}>
            Daftar sekarang
          </a>
        </p>
      )}
    </div>
  );
}
