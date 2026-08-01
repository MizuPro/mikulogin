"use client";

import React, { useState } from "react";
import "./styles.css";

export interface SignInProps {
  /**
   * Tema komponen UI ("light" | "dark").
   * Default: "light"
   */
  theme?: "light" | "dark";
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
   * URL menuju halaman lupa kata sandi.
   */
  forgotPasswordUrl?: string;
  /**
   * Judul halaman. Default: "Welcome Back"
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
   * Callback yang dipanggil setelah login berhasil.
   */
  onSuccess?: (data: any) => void;
}

/**
 * Komponen UI React SignIn untuk autentikasi masuk Mikulogin.
 * Mengikuti desain antarmuka modern Geist & Material Symbols.
 */
export function SignIn({
  theme = "light",
  loginApiUrl = "/api/auth/login",
  redirectTo = "/dashboard",
  signUpUrl = "/register",
  forgotPasswordUrl = "#",
  title = "Welcome Back",
  subtitle = "Please enter your credentials to access the dashboard.",
  protocolText = "Mikulogin Security Protocol V2.4",
  onSuccess,
}: SignInProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
        body: JSON.stringify({ email, password, rememberMe }),
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

        {/* Error Alert */}
        {error && <div className="miku-error">{error}</div>}

        {/* Form */}
        <form className="miku-form" onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="miku-form-group">
            <label className="miku-label" htmlFor="miku-email">
              Email Address
            </label>
            <div className="miku-input-wrapper">
              <span className="material-symbols-outlined miku-input-icon">mail</span>
              <input
                id="miku-email"
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
            <label className="miku-label" htmlFor="miku-password">
              Password
            </label>
            <div className="miku-input-wrapper">
              <span className="material-symbols-outlined miku-input-icon">lock</span>
              <input
                id="miku-password"
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

          {/* Utilities */}
          <div className="miku-utilities">
            <label className="miku-remember">
              <input
                type="checkbox"
                className="miku-checkbox-input"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <span className="miku-custom-checkbox" aria-hidden="true">
                <span className="material-symbols-outlined miku-check-icon">check</span>
              </span>
              <span>Remember me</span>
            </label>

            {forgotPasswordUrl && (
              <a href={forgotPasswordUrl} className="miku-forgot-link">
                Forgot password?
              </a>
            )}
          </div>

          {/* Action Submit */}
          <button 
            type="submit" 
            className="miku-button" 
            disabled={loading}
            onMouseMove={handleMouseMove}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {/* Footer Note */}
        {signUpUrl && (
          <div className="miku-footer">
            <p className="miku-footer-text">
              Don't have an account?{" "}
              <a href={signUpUrl} className="miku-footer-link">
                Create Account
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
