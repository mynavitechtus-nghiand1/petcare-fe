import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

type OrderItem = {
  id: number;
  product_name: string;
  sku: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

type Order = {
  id: number;
  status: string;
  subtotal_amount: number;
  shipping_name: string | null;
  shipping_phone: string | null;
  shipping_address: string | null;
  created_at: string;
  items: OrderItem[];
  payments: { status: string; provider: string; amount: number }[];
};

async function getOrders(token: string) {
  const res = await fetch("https://petcare-be-production.up.railway.app/api/v1/orders", {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const json = await res.json();
  return (json.data ?? []) as Order[];
}

type Props = { searchParams: Promise<{ success?: string }> };

export default async function OrdersPage({ searchParams }: Props) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) redirect("/login");

  const { success } = await searchParams;
  const orders = await getOrders(token);

  const statusLabel: Record<string, { label: string; cls: string }> = {
    paid:      { label: "Đã thanh toán", cls: "bg-green-100 text-green-700" },
    pending:   { label: "Chờ xử lý",     cls: "bg-yellow-100 text-yellow-700" },
    cancelled: { label: "Đã hủy",        cls: "bg-red-100 text-red-700" },
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Đơn hàng của tôi</h1>
        <Link href="/catalog" className="text-sm text-blue-600 hover:underline">
          Mua thêm →
        </Link>
      </div>

      {/* Success banner */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold text-green-800">Đặt hàng thành công!</p>
            <p className="text-sm text-green-600">Đơn hàng #{success} đã được xác nhận và thanh toán.</p>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-6xl">📦</span>
          <p className="text-slate-500 mt-4 mb-6">Bạn chưa có đơn hàng nào</p>
          <Link href="/catalog" className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors">
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const st = statusLabel[order.status] ?? { label: order.status, cls: "bg-slate-100 text-slate-600" };
            return (
              <div key={order.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <div>
                    <p className="font-semibold text-slate-800">Đơn #{order.id}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(order.created_at).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${st.cls}`}>
                    {st.label}
                  </span>
                </div>

                {/* Items */}
                <div className="px-5 py-3 space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <div>
                        <span className="font-medium text-slate-700">{item.product_name}</span>
                        <span className="text-slate-400 ml-2">× {item.quantity}</span>
                      </div>
                      <span className="text-slate-700">{item.line_total.toLocaleString("vi-VN")}đ</span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 bg-slate-50 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    {order.shipping_name && <span>{order.shipping_name}</span>}
                    {order.shipping_address && <span className="ml-2">· {order.shipping_address}</span>}
                  </div>
                  <p className="font-bold text-blue-600">
                    {order.subtotal_amount.toLocaleString("vi-VN")}đ
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
