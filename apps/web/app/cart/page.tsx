"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type CartItem = {
  id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    image_url: string | null;
    brand: { name: string };
    prices: { amount: number }[];
  };
};
type Cart = { id: number; items: CartItem[] };

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null); // item id đang xử lý

  async function loadCart(refresh = false) {
    const res = await fetch("/api/cart");
    if (!res.ok) { setLoading(false); return; }
    const json = await res.json();
    setCart(json.data);
    setLoading(false);
    if (refresh) router.refresh(); // sync navbar badge
  }

  useEffect(() => { loadCart(true); }, []);

  async function updateQty(itemId: number, qty: number) {
    if (qty < 1) return removeItem(itemId);
    setBusy(itemId);
    const res = await fetch(`/api/cart/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: qty }),
    });
    const json = await res.json();
    if (json.data) setCart(json.data);
    setBusy(null);
  }

  async function removeItem(itemId: number) {
    setBusy(itemId);
    const res = await fetch(`/api/cart/items/${itemId}`, { method: "DELETE" });
    const json = await res.json();
    if (json.data) setCart(json.data);
    setBusy(null);
    router.refresh(); // cập nhật badge navbar
  }

  const total = cart?.items.reduce(
    (sum, item) => sum + (item.product.prices[0]?.amount ?? 0) * item.quantity, 0
  ) ?? 0;

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-12 space-y-4">
        {[1, 2].map((i) => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}
      </main>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Giỏ hàng</h1>
        {!isEmpty && (
          <span className="text-sm text-slate-500">{cart!.items.length} sản phẩm</span>
        )}
      </div>

      {isEmpty ? (
        <div className="text-center py-20">
          <span className="text-6xl">🛒</span>
          <p className="text-slate-500 mt-4 mb-6">Giỏ hàng đang trống</p>
          <Link href="/catalog" className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors">
            Tiếp tục mua sắm
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {cart!.items.map((item) => {
              const price = item.product.prices[0]?.amount ?? 0;
              const isLoading = busy === item.id;
              return (
                <div key={item.id} className={`bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-sm transition-opacity ${isLoading ? "opacity-50" : ""}`}>
                  {/* Image / icon */}
                  <div className="relative w-14 h-14 rounded-lg flex-shrink-0 overflow-hidden">
                    {item.product.image_url ? (
                      <Image src={item.product.image_url} alt={item.product.name} fill className="object-cover" sizes="56px" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
                        <span className="text-2xl">🐾</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{item.product.name}</p>
                    <p className="text-xs text-slate-400">{item.product.brand.name}</p>
                    <p className="text-sm font-bold text-blue-600 mt-0.5">
                      {price.toLocaleString("vi-VN")}đ / sp
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                      disabled={isLoading}
                      className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-40 text-lg leading-none"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      disabled={isLoading}
                      className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-40 text-lg leading-none"
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal + delete */}
                  <div className="text-right flex-shrink-0 min-w-[80px]">
                    <p className="text-sm font-bold text-slate-800">
                      {(price * item.quantity).toLocaleString("vi-VN")}đ
                    </p>
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={isLoading}
                      className="text-xs text-slate-400 hover:text-red-500 transition-colors mt-1"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-500 text-sm">Tạm tính</span>
              <span className="font-semibold">{total.toLocaleString("vi-VN")}đ</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-500 text-sm">Phí vận chuyển</span>
              <span className="text-green-600 text-sm font-medium">Miễn phí</span>
            </div>
            <div className="flex justify-between items-center mb-5 pt-3 border-t border-slate-200">
              <span className="font-bold">Tổng cộng</span>
              <span className="text-xl font-bold text-blue-600">{total.toLocaleString("vi-VN")}đ</span>
            </div>
            <a
              href="/checkout"
              className="block w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-center"
            >
              Tiến hành thanh toán →
            </a>
          </div>

          <div className="text-center mt-5">
            <Link href="/catalog" className="text-sm text-blue-600 hover:underline">
              ← Tiếp tục mua sắm
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
