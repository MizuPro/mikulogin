"use client";

import React, { useState } from "react";
import "./styles.css";

export interface ForgotPasswordProps {
  /**
   * Tema komponen UI ("light" | "dark").
   * Default: "light"
   */
  theme?: "light" | "dark";
  /**
   * Endpoint URL untuk memproses permintaan lupa kata sandi.
   * Default: "/api/auth/forgot-password"
   */
  forgotPasswordApiUrl?: string;
  /**
   * URL menuju halaman masuk (SignIn).
   * Default: "/login"
   */
  signInUrl?: string;
  /**
   * Judul halaman. Default: "Reset Kata Sandi"
   */
  title?: string;
  /**
   * Sub-judul halaman.
   */
  subtitle?: string;
}

/**
 * Komponen UI React ForgotPassword untuk meminta tautan reset kata sandi Mikulogin.
 */
export function ForgotPassword({
  theme = "light",
  forgotPasswordApiUrl = "/api/auth/forgot-password",
  signInUrl = "/login",
  title = "Reset Kata Sandi",
  subtitle = "Masukkan email Anda untuk menerima tautan reset",
}: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const resetUrlBase =
        typeof window !== "undefined" ? window.location.origin + "/reset-password" : "";
      const res = await fetch(forgotPasswordApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, resetUrlBase }),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        setStatus("success");
        setMessage(data.message || "Tautan reset kata sandi telah dikirim.");
      } else {
        setStatus("error");
        setMessage(data?.error || "Gagal mengirim tautan reset. Silakan coba lagi.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Koneksi gagal. Coba lagi.");
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
    <div className={`miku-root ${theme === "dark" ? "miku-theme-dark" : ""} miku-container ${theme}`}>
      <div className="miku-card">
        <div className="miku-header">
          <h2 className="miku-title">{title}</h2>
          <p className="miku-subtitle">{subtitle}</p>
        </div>

        {status === "success" ? (
          <div className="miku-success miku-success-box">{message}</div>
        ) : (
          <form className="miku-form" onSubmit={handleSubmit}>
            <div className="miku-form-group miku-input-group">
              <label className="miku-label" htmlFor="miku-forgot-email">
                Email
              </label>
              <div className="miku-input-wrapper">
                <span className="material-symbols-outlined miku-input-icon">mail</span>
                <input
                  id="miku-forgot-email"
                  type="email"
                  className="miku-input"
                  placeholder="miku@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={status === "loading"}
                />
              </div>
            </div>
            {status === "error" && <p className="miku-error">{message}</p>}
            <button
              type="submit"
              className="miku-button"
              disabled={status === "loading"}
              onMouseMove={handleMouseMove}
            >
              {status === "loading" ? "Mengirim..." : "Kirim Tautan"}
            </button>
          </form>
        )}

        <div className="miku-footer">
          <p className="miku-footer-text">
            Ingat kata sandi Anda?{" "}
            <a href={signInUrl} className="miku-footer-link">
              Masuk di sini
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
