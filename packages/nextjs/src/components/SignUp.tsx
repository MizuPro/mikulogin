"use client";

import React, { useState } from "react";
import "./styles.css";

export interface SignUpProps {
  /**
   * Tema komponen UI ("light" | "dark").
   * Default: "light"
   */
  theme?: "light" | "dark";
  /**
   * Endpoint URL untuk memproses pendaftaran akun.
   * Default: "/api/auth/register"
   */
  registerApiUrl?: string;
  /**
   * URL menuju halaman masuk (SignIn).
   * Default: "/login"
   */
  signInUrl?: string;
  /**
   * Judul halaman. Default: "Create Account"
   */
  title?: string;
  /**
   * Sub-judul halaman.
   */
  subtitle?: string;
  /**
   * Teks protokol/branding footer.
   */
  protocolText?: string;
  /**
   * Callback yang dipanggil setelah pendaftaran berhasil.
   */
  onSuccess?: (data: any) => void;
}

/**
 * Komponen UI React SignUp untuk pendaftaran akun Mikulogin.
 * Mengikuti desain antarmuka modern Geist & Material Symbols.
 */
export function SignUp({
  theme = "light",
  registerApiUrl = "/api/auth/register",
  signInUrl = "/login",
  title = "Create Account",
  subtitle = "Fill in your details to create a new AuthPortal account.",
  protocolText = "Mikulogin Security Protocol V2.4",
  onSuccess,
}: SignUpProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
            ? "Gagal membuat akun. Pastikan data diisi dengan benar."
            : "Terjadi kesalahan sistem saat membuat akun.");
        throw new Error(errorMsg);
      }

      setSuccessMsg("Akun berhasil dibuat! Mengalihkan ke halaman masuk...");
      if (onSuccess) onSuccess(data);

      setTimeout(() => {
        if (signInUrl && typeof window !== "undefined") {
          window.location.href = signInUrl;
        }
      }, 1500);
    } catch (err) {
      setError((err as Error).message || "Terjadi kesalahan yang tidak terduga.");
    } finally {
      setLoading(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--x", `${x}px`);
    e.currentTarget.style.setProperty("--y", `${y}px`);
  };

  return (
    <div className={`miku-root ${theme === "dark" ? "miku-theme-dark" : ""}`}>
      <div className="miku-card">
        {/* Header */}
        <div className="miku-header">
          <h1 className="miku-title">{title}</h1>
          <p className="miku-subtitle">{subtitle}</p>
        </div>

        {/* Alerts */}
        {error && <div className="miku-error">{error}</div>}
        {successMsg && <div className="miku-success">{successMsg}</div>}

        {/* Form */}
        <form className="miku-form" onSubmit={handleSubmit}>
          {/* Full Name Field */}
          <div className="miku-form-group">
            <label className="miku-label" htmlFor="miku-name">
              Full Name
            </label>
            <div className="miku-input-wrapper">
              <span className="material-symbols-outlined miku-input-icon">person</span>
              <input
                id="miku-name"
                type="text"
                className="miku-input"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="miku-form-group">
            <label className="miku-label" htmlFor="miku-signup-email">
              Email Address
            </label>
            <div className="miku-input-wrapper">
              <span className="material-symbols-outlined miku-input-icon">mail</span>
              <input
                id="miku-signup-email"
                type="email"
                className="miku-input"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="miku-form-group">
            <label className="miku-label" htmlFor="miku-signup-password">
              Password
            </label>
            <div className="miku-input-wrapper">
              <span className="material-symbols-outlined miku-input-icon">lock</span>
              <input
                id="miku-signup-password"
                type={showPassword ? "text" : "password"}
                className="miku-input miku-input-has-toggle"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="miku-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <span className="material-symbols-outlined">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {/* Action Submit */}
          <button 
            type="submit" 
            className="miku-button" 
            disabled={loading}
            onMouseMove={handleMouseMove}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* Footer Note */}
        {signInUrl && (
          <div className="miku-footer">
            <p className="miku-footer-text">
              Already have an account?{" "}
              <a href={signInUrl} className="miku-footer-link">
                Sign In
              </a>
            </p>
          </div>
        )}
      </div>

      {/* Branding / Security Protocol */}
      {protocolText && (
        <div className="miku-branding">
          <p className="miku-branding-text">{protocolText}</p>
        </div>
      )}
    </div>
  );
}
