import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        color: "#ffffff",
        padding: "2rem",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          textAlign: "center",
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(16px)",
          borderRadius: "24px",
          padding: "3rem 2rem",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
        }}
      >
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, margin: "0 0 1rem 0", color: "#38bdf8" }}>
          Mikulogin Playground
        </h1>
        <p style={{ fontSize: "1.1rem", color: "#94a3b8", marginBottom: "2rem", lineHeight: 1.6 }}>
          Demonstrasi integrasi komponen antarmuka Mikulogin (`&lt;SignIn /&gt;` & `&lt;SignUp /&gt;`) pada aplikasi Next.js App Router.
        </p>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/login"
            style={{
              padding: "0.875rem 2rem",
              borderRadius: "12px",
              background: "#0284c7",
              color: "#ffffff",
              fontWeight: 600,
              textDecoration: "none",
              transition: "all 0.2s ease",
            }}
          >
            Halaman Login (&lt;SignIn /&gt;)
          </Link>
          <Link
            href="/register"
            style={{
              padding: "0.875rem 2rem",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.1)",
              color: "#ffffff",
              fontWeight: 600,
              textDecoration: "none",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              transition: "all 0.2s ease",
            }}
          >
            Halaman Register (&lt;SignUp /&gt;)
          </Link>
        </div>
      </div>
    </main>
  );
}
