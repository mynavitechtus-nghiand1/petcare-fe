import { Card } from "@petcare/ui";
import Link from "next/link";
import { apiFetch } from "../lib/api";

type Product = {
  id: number;
  name: string;
  image_url: string | null;
  brand: { name: string };
  prices: { currency: string; amount: number }[];
};
type Category = { slug: string; name: string };

// SSR: cache: 'no-store' → gọi API mỗi request → luôn có data mới nhất
async function getFeaturedProducts() {
  const res = await apiFetch("/api/v1/products?per_page=4", { cache: "no-store" });
  const json = await res.json();
  return json.data as Product[];
}

async function getCategories() {
  const res = await apiFetch("/api/v1/categories", { cache: "no-store" });
  const json = await res.json();
  return json.data as Category[];
}

const CATEGORY_ICONS: Record<string, string> = {
  dog: "🐕",
  cat: "🐈",
  food: "🦴",
  toy: "🧸",
  health: "💊",
  grooming: "✂️",
  accessories: "🎀",
  default: "🛍️",
};

function getCategoryIcon(slug: string): string {
  for (const key of Object.keys(CATEGORY_ICONS)) {
    if (slug.toLowerCase().includes(key)) return CATEGORY_ICONS[key];
  }
  return CATEGORY_ICONS.default;
}

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
  ]);

  return (
    <main>
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-eyebrow">
            ✨ Thương hiệu hàng đầu cho thú cưng của bạn
          </div>

          <h1 className="hero-title">
            Chăm sóc thú cưng<br />
            <span>tốt nhất cho bé</span>
          </h1>

          <p className="hero-sub">
            Hàng nghìn sản phẩm chất lượng cao từ các thương hiệu uy tín,
            giao hàng tận nhà nhanh chóng.
          </p>

          <div className="hero-cta-group">
            <Link href="/catalog" className="hero-cta-primary">
              Mua sắm ngay
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link href="/catalog" className="hero-cta-secondary">
              Xem danh mục
            </Link>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">500+</div>
              <div className="hero-stat-label">Sản phẩm</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">50+</div>
              <div className="hero-stat-label">Thương hiệu</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">10k+</div>
              <div className="hero-stat-label">Khách hàng</div>
            </div>
          </div>
        </div>
      </section>

      <div className="main-content">
        {/* ── Categories ────────────────────────────────────────────── */}
        <section className="categories-section">
          <div className="section-header">
            <h2 className="section-title">Danh mục sản phẩm</h2>
            <Link href="/catalog" className="section-link">
              Xem tất cả →
            </Link>
          </div>
          <div className="categories-grid">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/catalog?category=${cat.slug}`}
                className="category-pill"
              >
                <span>{getCategoryIcon(cat.slug)}</span>
                {cat.name}
              </Link>
            ))}
          </div>
        </section>

        {/* ── Featured Products ──────────────────────────────────────── */}
        <section>
          <div className="section-header">
            <h2 className="section-title">Sản phẩm nổi bật</h2>
            <Link href="/catalog" className="section-link">
              Xem tất cả →
            </Link>
          </div>

          <div className="products-grid">
            {products.map((p) => {
              const price = p.prices[0]?.amount;
              return (
                <Link key={p.id} href={`/catalog/${p.id}`} className="product-card-link">
                  <article className="product-card">
                    {/* Image */}
                    <div className="product-card-image">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
                        />
                      ) : (
                        <>
                          <div className="product-card-image-bg" />
                          <span className="product-card-paw">🐾</span>
                          <span className="product-card-brand">{p.brand.name}</span>
                        </>
                      )}
                    </div>

                    {/* Brand tag */}
                    <div className="product-card-tag">{p.brand.name}</div>

                    {/* Name */}
                    <p className="product-card-name">{p.name}</p>

                    {/* Footer */}
                    <div className="product-card-footer">
                      <span className="product-card-price">
                        {price != null
                          ? `${price.toLocaleString("vi-VN")}đ`
                          : "Liên hệ"}
                      </span>
                      <span className="product-card-stock-badge in-stock">
                        Còn hàng
                      </span>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
