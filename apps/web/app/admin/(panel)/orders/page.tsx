"use client";
import { useState, useEffect, useCallback } from "react";

type OrderItem = {
  product: { name: string };
  quantity: number;
  price: number;
};

type Order = {
  id: number;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
  user: { name: string; email: string };
  items: OrderItem[];
};

type Meta = {
  total: number;
  per_page: number;
  current_page: number;
  last_page?: number;
};

const STATUS_LIST = ["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;
type StatusFilter = (typeof STATUS_LIST)[number];

const STATUS_LABELS: Record<string, string> = {
  all: "Tất cả",
  pending: "Chờ xử lý",
  confirmed: "Đã xác nhận",
  processing: "Đang xử lý",
  shipped: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã huỷ",
};

const NEXT_STATUS: Record<string, string[]> = {
  pending:    ["confirmed", "cancelled"],
  confirmed:  ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped:    ["delivered", "cancelled"],
  delivered:  [],
  cancelled:  [],
};

function formatCurrency(amount: number, currency: string) {
  if (currency === "VND") return amount.toLocaleString("vi-VN") + "đ";
  return amount.toLocaleString("en-US", { style: "currency", currency });
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return dateStr;
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const fetchOrders = useCallback((status: StatusFilter, p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ per_page: "20", page: String(p) });
    if (status !== "all") params.set("status", status);
    fetch(`/api/admin/orders?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.data?.data ?? []);
        setMeta(d.data?.meta ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchOrders(statusFilter, page);
  }, [statusFilter, page, fetchOrders]);

  function handleFilterChange(s: StatusFilter) {
    setStatusFilter(s);
    setPage(1);
  }

  function openOrder(o: Order) {
    setSelectedOrder(o);
    setNewStatus(o.status);
    setUpdateError(null);
  }

  function closeModal() {
    setSelectedOrder(null);
    setUpdateError(null);
  }

  async function updateStatus() {
    if (!selectedOrder || newStatus === selectedOrder.status) return;
    setUpdatingStatus(true);
    setUpdateError(null);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setUpdateError(json.message ?? `Cập nhật thất bại (${res.status})`);
        return;
      }
      setOrders((prev) =>
        prev.map((o) => (o.id === selectedOrder.id ? { ...o, status: newStatus } : o))
      );
      setSelectedOrder((prev) => prev ? { ...prev, status: newStatus } : null);
    } catch (err) {
      setUpdateError("Lỗi kết nối: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUpdatingStatus(false);
    }
  }

  const totalPages = meta?.last_page ?? (meta ? Math.ceil(meta.total / meta.per_page) : 1);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Quản lý đơn hàng</h1>
          <p className="admin-page-subtitle">
            {loading ? "Đang tải..." : meta ? `${meta.total} đơn hàng tổng cộng` : `${orders.length} đơn hàng`}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="admin-filter-tabs">
        {STATUS_LIST.map((s) => (
          <button
            key={s}
            className={`admin-filter-tab${statusFilter === s ? " active" : ""}`}
            onClick={() => handleFilterChange(s)}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="admin-loading" style={{ minHeight: 300 }}>
          <div className="admin-loading-spinner" />
          <span className="admin-loading-text">Đang tải đơn hàng...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">🛒</div>
          <p className="admin-empty-text">Không có đơn hàng nào.</p>
        </div>
      ) : (
        <>
          <div className="admin-list">
            {orders.map((o) => (
              <div key={o.id} className="admin-list-card" onClick={() => openOrder(o)}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: "linear-gradient(135deg, #fef9c3, #fef3c7)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, flexShrink: 0,
                }}>
                  🛒
                </div>
                <div className="admin-list-card-info">
                  <div className="admin-list-card-name">
                    #{o.id} — {o.user?.name ?? "Khách hàng"}
                  </div>
                  <div className="admin-list-card-meta">
                    {o.user?.email && <span style={{ marginRight: 8 }}>{o.user.email}</span>}
                    <span style={{ marginRight: 8 }}>{formatDate(o.created_at)}</span>
                    <span style={{ fontWeight: 700, color: "var(--color-primary)" }}>
                      {formatCurrency(o.total_amount, o.currency ?? "VND")}
                    </span>
                  </div>
                </div>
                <span className={`badge ${o.status}`}>
                  {STATUS_LABELS[o.status] ?? o.status}
                </span>
                <div className="admin-list-card-actions">
                  <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); openOrder(o); }}>
                    Chi tiết
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="admin-pagination">
              <button
                className="btn btn-outline btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Trước
              </button>
              <span className="admin-pagination-info">
                Trang {page} / {totalPages}
              </span>
              <button
                className="btn btn-outline btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau →
              </button>
            </div>
          )}
        </>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal-card" style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <h2 className="modal-title">Đơn hàng #{selectedOrder.id}</h2>
              <button className="modal-close-btn" onClick={closeModal} aria-label="Đóng">×</button>
            </div>

            <div className="modal-form">
              {/* Customer info */}
              <div style={{
                background: "var(--color-bg)",
                borderRadius: "var(--admin-radius-md)",
                padding: "14px 16px",
                display: "flex", flexDirection: "column", gap: 4,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>
                  {selectedOrder.user?.name ?? "—"}
                </div>
                <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                  {selectedOrder.user?.email ?? "—"}
                </div>
                <div style={{ fontSize: 12, color: "var(--color-text-faint)", marginTop: 2 }}>
                  {formatDate(selectedOrder.created_at)}
                </div>
              </div>

              {/* Items */}
              {selectedOrder.items?.length > 0 && (
                <div className="form-field">
                  <label className="form-label">Sản phẩm đặt hàng</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "8px 12px",
                        background: "#fafafa",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--admin-radius-md)",
                        fontSize: 13,
                      }}>
                        <span style={{ fontWeight: 600, color: "var(--color-text)" }}>
                          {item.product?.name ?? "Sản phẩm"}
                        </span>
                        <span style={{ color: "var(--color-text-muted)" }}>
                          x{item.quantity} · {formatCurrency(item.price, selectedOrder.currency ?? "VND")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 16px",
                background: "var(--color-primary-light)",
                borderRadius: "var(--admin-radius-md)",
                border: "1px solid var(--color-border)",
              }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>Tổng cộng</span>
                <span style={{ fontWeight: 800, fontSize: 16, color: "var(--color-primary)" }}>
                  {formatCurrency(selectedOrder.total_amount, selectedOrder.currency ?? "VND")}
                </span>
              </div>

              {/* Status update */}
              <div className="form-field">
                <label className="form-label">Cập nhật trạng thái</label>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <select
                    className="form-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    style={{ flex: 1 }}
                  >
                    {/* Always include current status */}
                    <option value={selectedOrder.status}>
                      {STATUS_LABELS[selectedOrder.status] ?? selectedOrder.status} (hiện tại)
                    </option>
                    {(NEXT_STATUS[selectedOrder.status] ?? [])
                      .filter((s) => s !== selectedOrder.status)
                      .map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
                      ))
                    }
                  </select>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={updateStatus}
                    disabled={updatingStatus || newStatus === selectedOrder.status}
                    style={{ flexShrink: 0 }}
                  >
                    {updatingStatus ? "Đang lưu..." : "Cập nhật"}
                  </button>
                </div>
              </div>
            </div>

            {updateError && <div className="modal-error">{updateError}</div>}

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={closeModal}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
