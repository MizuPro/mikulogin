"use client";

import { SignIn } from "mikulogin";

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f1f5f9",
        padding: "1.5rem",
        boxSizing: "border-box",
      }}
    >
      <SignIn loginApiUrl="/api/auth/login" signUpUrl="/register" redirectTo="/dashboard" />
    </main>
  );
}
