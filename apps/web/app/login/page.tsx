"use client"; // form cần tương tác → Client Component

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/"; // trang muốn vào trước khi bị chặn

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    // Gọi qua Next.js API route nội bộ — tránh CORS
    // Client Component không gọi thẳng backend được
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      setError("Sai tài khoản hoặc mật khẩu");
      setLoading(false);
      return;
    }

    const data = await res.json();

    await fetch("/api/auth/set-cookie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: data.data.access_token }),
    });

    router.push(from);
    router.refresh();
  }

  return (
    <main className="login-page">
      <div className="login-container">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo">🐾</div>
          <h1 className="login-title">Chào mừng trở lại</h1>
          <p className="login-subtitle">Đăng nhập để tiếp tục mua sắm</p>
        </div>

        {/* Card */}
        <div className="login-card">
          <form onSubmit={handleSubmit} className="login-form">
            {/* Email */}
            <div className="login-field">
              <label htmlFor="email" className="login-label">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue="admin@petcare.com"
                required
                className="login-input"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div className="login-field">
              <label htmlFor="password" className="login-label">Mật khẩu</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                defaultValue="password"
                required
                className="login-input"
                placeholder="••••••••"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="login-error" role="alert">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="login-submit-btn"
            >
              {loading ? (
                <>Đang đăng nhập...</>
              ) : (
                <>Đăng nhập</>
              )}
            </button>
          </form>
        </div>

        {/* Demo hint */}
        <div className="login-demo-hint">
          <p>Tài khoản demo</p>
          <span>
            <code className="login-demo-code">admin@petcare.com</code>
            {" "}·{" "}
            <code className="login-demo-code">password</code>
          </span>
        </div>

        {/* Trust badges */}
        <div className="trust-badges">
          <div className="trust-badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            Bảo mật SSL
          </div>
          <div className="trust-badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Mã hóa dữ liệu
          </div>
        </div>
      </div>
    </main>
  );
}
