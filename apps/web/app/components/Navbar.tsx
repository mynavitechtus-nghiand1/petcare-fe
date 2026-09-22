import { cookies } from "next/headers";
import Link from "next/link";

async function getCartCount(token: string): Promise<number> {
  try {
    const res = await fetch("https://petcare-be-production.up.railway.app/api/v1/cart", {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return 0;
    const json = await res.json();
    return (json.data?.items ?? []).length;
  } catch {
    return 0;
  }
}

export async function Navbar() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  const isLoggedIn = !!token;
  const cartCount = isLoggedIn ? await getCartCount(token!) : 0;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link href="/" className="navbar-logo">
          <div className="navbar-logo-icon">🐾</div>
          PetCare<span style={{ color: "#7c3aed" }}>+</span>
        </Link>

        {/* Nav links */}
        <div className="navbar-nav">
          <Link href="/" className="navbar-nav-link">Trang chủ</Link>
          <Link href="/catalog" className="navbar-nav-link">Sản phẩm</Link>
        </div>

        {/* Auth / Actions */}
        <div className="navbar-actions">
          {isLoggedIn ? (
            <>
              {/* Cart */}
              <Link href="/cart" className="navbar-cart-btn" aria-label="Giỏ hàng">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartCount > 0 && (
                  <span className="navbar-cart-badge">{cartCount > 9 ? "9+" : cartCount}</span>
                )}
              </Link>

              {/* Orders */}
              <Link href="/orders" className="navbar-link">Đơn hàng</Link>

              {/* Logout */}
              <LogoutButton />
            </>
          ) : (
            <Link href="/login" className="navbar-login-btn">
              Đăng nhập
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="POST">
      <button type="submit" className="navbar-logout-btn">
        Đăng xuất
      </button>
    </form>
  );
}
