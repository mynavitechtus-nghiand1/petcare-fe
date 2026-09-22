"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Products", icon: "📦", exact: true },
  { href: "/admin/brands", label: "Brands", icon: "🏷️", exact: false },
  { href: "/admin/categories", label: "Categories", icon: "📂", exact: false },
  { href: "/admin/orders", label: "Orders", icon: "🛒", exact: false },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-logo">
        <div className="admin-sidebar-logo-icon">🐾</div>
        PetCare+ Admin
      </div>

      <nav className="admin-sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`admin-sidebar-link${isActive(item.href, item.exact) ? " active" : ""}`}
          >
            <span className="admin-sidebar-link-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <Link href="/" className="admin-sidebar-back">
          ← Về trang web
        </Link>
      </div>
    </aside>
  );
}
