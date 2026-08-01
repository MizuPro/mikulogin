"use client";

import { useState } from "react";
import { SignUp } from "mikulogin";

export default function RegisterPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: theme === "dark" ? "#000000" : "#f1f5f9",
        padding: "1.5rem",
        boxSizing: "border-box",
        transition: "background 0.3s ease",
      }}
    >
      <div style={{ marginBottom: "1.25rem" }}>
        <button
          type="button"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          style={{
            padding: "8px 16px",
            borderRadius: "20px",
            border: theme === "dark" ? "1px solid #334155" : "1px solid #cbd5e1",
            background: theme === "dark" ? "#1e293b" : "#ffffff",
            color: theme === "dark" ? "#f8fafc" : "#0f172a",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "13px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            transition: "all 0.2s ease",
          }}
        >
          {theme === "light" ? "🌙 Switch to Dark Theme" : "☀️ Switch to Light Theme"}
        </button>
      </div>
      <SignUp theme={theme} registerApiUrl="/api/auth/register" signInUrl="/login" />
    </main>
  );
}
