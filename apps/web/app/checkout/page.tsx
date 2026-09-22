"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CartItem = {
  id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    brand: { name: string };
    prices: { amount: number }[];
  };
};

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    shipping_name: "",
    shipping_phone: "",
    shipping_address: "",
  });

  useEffect(() => {
    fetch("/api/cart")
      .then((r) => r.json())
      .then((d) => {
        const cartItems = d.data?.items ?? [];
        if (cartItems.length === 0) router.replace("/cart");
        setItems(cartItems);
        setLoading(false);
      });
  }, []);

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const total = items.reduce(
    (sum, item) => sum + (item.product.prices[0]?.amount ?? 0) * item.quantity,
    0
  );

  const isValid = form.shipping_name && form.shipping_phone && form.shipping_address;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, payment_method: "cod" }),
    });
    const data = await res.json();

    if (data.success) {
      router.push(`/orders?success=${data.data.id}`);
    } else {
      alert(data.message ?? "Đặt hàng thất bại");
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white";

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-12 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-800 mb-8">Thanh toán</h1>

      <form onSubmit={handleSubmit} className="grid md:grid-cols-5 gap-8">
        {/* Left: shipping form */}
        <div className="md:col-span-3 space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="font-semibold text-slate-700 mb-4">Thông tin giao hàng</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Họ tên *</label>
                <input
                  className={inputCls}
                  value={form.shipping_name}
                  onChange={(e) => set("shipping_name", e.target.value)}
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Số điện thoại *</label>
                <input
                  className={inputCls}
                  value={form.shipping_phone}
                  onChange={(e) => set("shipping_phone", e.target.value)}
                  placeholder="0901234567"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Địa chỉ giao hàng *</label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={3}
                  value={form.shipping_address}
                  onChange={(e) => set("shipping_address", e.target.value)}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                  required
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="font-semibold text-slate-700 mb-4">Phương thức thanh toán</h2>
            <label className="flex items-center gap-3 p-3 border border-blue-200 rounded-lg bg-blue-50 cursor-pointer">
              <input type="radio" checked readOnly className="accent-blue-600" />
              <div>
                <p className="text-sm font-medium text-slate-700">Thanh toán khi nhận hàng (COD)</p>
                <p className="text-xs text-slate-400">Mock payment — tự động xác nhận</p>
              </div>
            </label>
          </div>
        </div>

        {/* Right: order summary */}
        <div className="md:col-span-2">
          <div className="bg-white border border-slate-200 rounded-xl p-5 sticky top-20">
            <h2 className="font-semibold text-slate-700 mb-4">Đơn hàng ({items.length} sp)</h2>

            <div className="space-y-3 mb-4">
              {items.map((item) => {
                const price = item.product.prices[0]?.amount ?? 0;
                return (
                  <div key={item.id} className="flex justify-between items-start gap-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-700 truncate">{item.product.name}</p>
                      <p className="text-slate-400 text-xs">× {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-slate-700 flex-shrink-0">
                      {(price * item.quantity).toLocaleString("vi-VN")}đ
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-100 pt-3 mb-5">
              <div className="flex justify-between text-sm text-slate-500 mb-1">
                <span>Tạm tính</span>
                <span>{total.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500 mb-3">
                <span>Vận chuyển</span>
                <span className="text-green-600 font-medium">Miễn phí</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Tổng</span>
                <span className="text-blue-600 text-lg">{total.toLocaleString("vi-VN")}đ</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!isValid || submitting}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Đang đặt hàng..." : "Đặt hàng"}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
