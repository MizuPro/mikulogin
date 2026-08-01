import React, { useState } from "react";
import "./styles.css";

export interface SignUpProps {
  /**
   * Endpoint URL untuk pendaftaran akun baru.
   * Default: "/api/auth/register"
   */
  registerApiUrl?: string;
  /**
   * URL menuju halaman masuk (SignIn).
   * Default: "/login"
   */
  signInUrl?: string;
  /**
   * Callback yang dipanggil setelah pendaftaran berhasil.
   */
  onSuccess?: (data: any) => void;
}

/**
 * Komponen UI React SignUp untuk registrasi akun baru Mikulogin.
 */
export function SignUp({
  registerApiUrl = "/api/auth/register",
  signInUrl = "/login",
  onSuccess,
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

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || !data.success) {
        const errorMsg =
          data?.error ||
          (res.status === 400
            ? "Data pendaftaran tidak valid atau email sudah terdaftar"
            : "Terjadi kesalahan saat membuat akun. Silakan coba lagi.");
        throw new Error(errorMsg);
      }

      setSuccessMsg("Akun berhasil dibuat! Mengalihkan ke halaman login...");

      if (onSuccess) {
        onSuccess(data);
      }

      if (signInUrl && typeof window !== "undefined") {
        setTimeout(() => {
          window.location.href = signInUrl;
        }, 1500);
      }
    } catch (err) {
      setError((err as Error).message || "Terjadi kesalahan yang tidak terduga.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="miku-card">
      <h2 className="miku-title">Daftar Akun Baru</h2>
      <p className="miku-subtitle">Buat akun baru untuk mulai menggunakan sistem</p>

      {error && <div className="miku-error">{error}</div>}
      {successMsg && <div className="miku-success">{successMsg}</div>}

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
            disabled={loading}
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
          {loading ? "Memproses..." : "Daftar"}
        </button>
      </form>

      {signInUrl && (
        <p className="miku-subtitle" style={{ marginTop: "1.5rem", marginBottom: 0 }}>
          Sudah punya akun?{" "}
          <a href={signInUrl} style={{ color: "#0284c7", fontWeight: 600, textDecoration: "none" }}>
            Masuk di sini
          </a>
        </p>
      )}
    </div>
  );
}
