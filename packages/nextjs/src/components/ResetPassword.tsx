"use client";

import React, { useState, useEffect } from "react";
import "./styles.css";

export interface ResetPasswordProps {
  /**
   * Tema komponen UI ("light" | "dark").
   * Default: "light"
   */
  theme?: "light" | "dark";
  /**
   * Endpoint URL untuk memproses reset kata sandi baru.
   * Default: "/api/auth/reset-password"
   */
  resetPasswordApiUrl?: string;
  /**
   * URL menuju halaman masuk (SignIn).
   * Default: "/login"
   */
  signInUrl?: string;
  /**
   * Judul halaman. Default: "Buat Kata Sandi Baru"
   */
  title?: string;
  /**
   * Sub-judul halaman.
   */
  subtitle?: string;
}

/**
 * Komponen UI React ResetPassword untuk mengatur ulang kata sandi baru Mikulogin.
 */
export function ResetPassword({
  theme = "light",
  resetPasswordApiUrl = "/api/auth/reset-password",
  signInUrl = "/login",
  title = "Buat Kata Sandi Baru",
  subtitle = "Masukkan kata sandi baru Anda di bawah ini",
}: ResetPasswordProps) {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const urlToken = searchParams.get("token");
      if (urlToken) {
        setToken(urlToken);
      } else {
        setStatus("error");
        setMessage("Tautan reset tidak valid atau tidak memiliki token.");
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(resetPasswordApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        setStatus("success");
        setMessage("Kata sandi berhasil diperbarui. Silakan masuk.");
      } else {
        setStatus("error");
        setMessage(data?.error || "Gagal memperbarui kata sandi. Silakan coba lagi.");
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
          <div className="miku-success miku-success-box">
            <p>{message}</p>
            <a
              href={signInUrl}
              className="miku-button"
              style={{ display: "inline-block", marginTop: "1rem", textAlign: "center", textDecoration: "none" }}
            >
              Masuk Sekarang
            </a>
          </div>
        ) : (
          <form className="miku-form" onSubmit={handleSubmit}>
            <div className="miku-form-group miku-input-group">
              <label className="miku-label" htmlFor="miku-reset-password">
                Kata Sandi Baru (Min. 8 karakter)
              </label>
              <div className="miku-input-wrapper">
                <span className="material-symbols-outlined miku-input-icon">lock</span>
                <input
                  id="miku-reset-password"
                  type="password"
                  className="miku-input"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={status === "loading" || !token}
                />
              </div>
            </div>
            {status === "error" && <p className="miku-error">{message}</p>}
            <button
              type="submit"
              className="miku-button"
              disabled={status === "loading" || !token}
              onMouseMove={handleMouseMove}
            >
              {status === "loading" ? "Memproses..." : "Simpan Kata Sandi"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
