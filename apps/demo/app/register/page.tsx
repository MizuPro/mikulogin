"use client";

import { SignUp } from "mikulogin";

export default function RegisterPage() {
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
      <SignUp registerApiUrl="/api/auth/register" signInUrl="/login" />
    </main>
  );
}
