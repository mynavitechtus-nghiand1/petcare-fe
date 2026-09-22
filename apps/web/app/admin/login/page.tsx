"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        setError("Sai mật khẩu admin.");
        setLoading(false);
      }
    } catch {
      setError("Lỗi kết nối, thử lại.");
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(160deg, #f0f7ff 0%, #faf5ff 50%, #f8fafc 100%)",
      padding: "24px",
      fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56,
            background: "linear-gradient(135deg, #2563eb, #7c3aed)",
            borderRadius: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26,
            margin: "0 auto 16px",
            boxShadow: "0 8px 24px rgba(37,99,235,0.35)",
          }}>🐾</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.04em", margin: 0 }}>
            PetCare+ Admin
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>Nhập mật khẩu để vào trang quản trị</p>
        </div>

        <form onSubmit={handleSubmit} style={{
          background: "white",
          borderRadius: 16,
          border: "1.5px solid #e2e8f0",
          padding: 28,
          boxShadow: "0 8px 32px rgba(0,0,0,0.07)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              style={{
                width: "100%",
                padding: "10px 13px",
                border: "1.5px solid #e2e8f0",
                borderRadius: 10,
                fontSize: 15,
                color: "#0f172a",
                background: "#fafafa",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: "10px 14px",
              background: "#fee2e2",
              color: "#dc2626",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: "100%",
              padding: "12px 24px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "white",
              fontSize: 14,
              fontWeight: 700,
              border: "none",
              borderRadius: 10,
              cursor: loading || !password ? "not-allowed" : "pointer",
              opacity: loading || !password ? 0.65 : 1,
              fontFamily: "inherit",
              boxShadow: "0 3px 12px rgba(37,99,235,0.4)",
            }}
          >
            {loading ? "Đang xác thực..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}
