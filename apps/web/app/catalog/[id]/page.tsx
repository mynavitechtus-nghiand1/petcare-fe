import { Card } from "@petcare/ui";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { apiFetch } from "../../../lib/api";
import { AddToCartButton } from "../../components/AddToCartButton";

type Product = {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  brand: { name: string };
  categories: { name: string }[];
  prices: { currency: string; amount: number }[];
  inventory: { quantity: number };
};

// SSG: pre-render tất cả sản phẩm lúc build
export async function generateStaticParams() {
  const res = await apiFetch("/api/v1/products");
  const json = await res.json();
  return json.data.map((p: { id: number }) => ({ id: String(p.id) }));
}

export const revalidate = 3600;

async function getProduct(id: string) {
  const res = await apiFetch(`/api/v1/products/${id}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.data as Product;
}

type Props = { params: Promise<{ id: string }> };

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const price = product.prices[0];

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <Link href="/catalog" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-8">
        ← Quay lại sản phẩm
      </Link>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Ảnh / placeholder */}
        {product.image_url ? (
          <div className="relative h-80 rounded-2xl overflow-hidden shadow-md">
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        ) : (
          <div className="bg-gradient-to-br from-blue-100 to-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 min-h-80 shadow-inner">
            <span className="text-7xl">🐾</span>
            <span className="text-slate-500 font-semibold text-lg">{product.brand.name}</span>
          </div>
        )}

        {/* Info */}
        <div className="flex flex-col justify-center">
          <div className="flex gap-2 mb-3">
            {product.categories.map((c) => (
              <span key={c.name} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                {c.name}
              </span>
            ))}
          </div>

          <h1 className="text-3xl font-bold text-slate-800 mb-3">{product.name}</h1>

          <p className="text-4xl font-bold text-blue-600 mb-2">
            {price?.amount.toLocaleString("vi-VN")}đ
          </p>

          <div className="flex items-center gap-2 mb-6">
            <span className={`w-2 h-2 rounded-full ${(product.inventory?.quantity ?? 0) > 0 ? "bg-green-500" : "bg-red-400"}`} />
            <span className="text-sm text-slate-500">
              {(product.inventory?.quantity ?? 0) > 0 ? `Còn ${product.inventory.quantity} sản phẩm` : "Hết hàng"}
            </span>
          </div>

          <p className="text-slate-600 text-sm leading-relaxed mb-8">
            {product.description ?? "Sản phẩm chất lượng cao dành cho thú cưng của bạn."}
          </p>

          <div className="flex gap-3">
            <AddToCartButton productId={product.id} label="Thêm vào giỏ hàng" />
            <Link href="/cart">
              <span className="inline-flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded font-medium text-sm hover:bg-blue-50 transition-colors">
                Xem giỏ hàng
              </span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
