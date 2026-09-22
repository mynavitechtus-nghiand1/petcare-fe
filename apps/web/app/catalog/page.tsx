import { Card } from "@petcare/ui";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { CatalogClient } from "../components/CatalogClient";
import { AddToCartButton } from "../components/AddToCartButton";
import { apiFetch } from "../../lib/api";

type Product = {
  id: number;
  name: string;
  image_url: string | null;
  brand: { name: string };
  prices: { currency: string; amount: number }[];
  inventory: { quantity: number } | null;
};
type Category = { id: number; name: string; slug: string };

type Props = {
  searchParams: Promise<{ q?: string; category_id?: string }>;
};

async function getData(q?: string, categoryId?: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (categoryId) params.set("category_id", categoryId);
  params.set("per_page", "20");

  const [productsRes, categoriesRes] = await Promise.all([
    apiFetch(`/api/v1/products?${params}`, { next: { revalidate: 10 } }),
    apiFetch("/api/v1/categories", { next: { revalidate: 300 } }),
  ]);
  const [products, categories] = await Promise.all([
    productsRes.json(),
    categoriesRes.json(),
  ]);
  return {
    products: (products.data ?? []) as Product[],
    categories: (categories.data ?? []) as Category[],
    total: products.meta?.total ?? 0,
  };
}

export default async function CatalogPage({ searchParams }: Props) {
  const { q, category_id } = await searchParams;
  const { products, categories, total } = await getData(q, category_id);

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Tất cả sản phẩm</h1>
        <p className="text-slate-500 text-sm mt-1">
          {q ? `Kết quả cho "${q}": ` : ""}{total} sản phẩm
        </p>
      </div>

      <Suspense>
        <CatalogClient categories={categories} />
      </Suspense>

      {products.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-4xl mb-3">🔍</p>
          <p>Không tìm thấy sản phẩm nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {products.map((p) => (
            <Card key={p.id} className="flex flex-col h-full">
              <Link href={`/catalog/${p.id}`} className="flex-1">
                {p.image_url ? (
                  <div className="relative w-full h-36 rounded-lg mb-3 overflow-hidden">
                    <Image
                      src={p.image_url}
                      alt={p.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                ) : (
                  <div className="w-full h-36 bg-gradient-to-br from-blue-50 to-slate-100 rounded-lg mb-3 flex flex-col items-center justify-center gap-1">
                    <span className="text-3xl">🐾</span>
                    <span className="text-xs text-slate-400 font-medium">{p.brand.name}</span>
                  </div>
                )}
                <p className="text-sm font-semibold text-slate-800 line-clamp-2 mb-1">{p.name}</p>
                {p.prices[0]?.amount ? (
                  <p className="text-blue-600 font-bold text-base mb-1">
                    {p.prices[0].amount.toLocaleString("vi-VN")}đ
                  </p>
                ) : (
                  <p className="text-slate-400 text-sm mb-1">Liên hệ</p>
                )}
                <p className="text-xs text-slate-400 mb-3">
                  {(p.inventory?.quantity ?? 0) > 0 ? `Còn ${p.inventory!.quantity}` : "Hết hàng"}
                </p>
              </Link>
              <AddToCartButton productId={p.id} variant="outline" label="Thêm vào giỏ" />
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
