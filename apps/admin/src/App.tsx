import { useState, useEffect } from "react";
import "./App.css";

type Brand = { id: number; name: string };
type Product = {
  id: number;
  name: string;
  sku: string;
  slug: string;
  brand_id: number;
  brand: { name: string };
  status: string;
  description: string | null;
  image_url: string | null;
  prices: { currency: string; amount: number }[];
  inventory: { quantity: number } | null;
};

type Form = {
  name: string;
  sku: string;
  brand_id: string;
  status: string;
  description: string;
  price: string;
  quantity: string;
  image_url: string;
};

const EMPTY_FORM: Form = {
  name: "", sku: "", brand_id: "1", status: "published", description: "", price: "", quantity: "", image_url: "",
};

const BASIC = "Basic " + btoa(import.meta.env.VITE_BASIC_AUTH ?? "");

async function doLogin(): Promise<{ access_token: string; refresh_token: string } | null> {
  const res = await fetch("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: BASIC },
    body: JSON.stringify({
      email: import.meta.env.VITE_ADMIN_EMAIL,
      password: import.meta.env.VITE_ADMIN_PASSWORD,
    }),
  });
  const d = await res.json();
  if (!d.data?.access_token) return null;
  return { access_token: d.data.access_token, refresh_token: d.data.refresh_token };
}

async function doRefresh(refreshToken: string): Promise<{ access_token: string; refresh_token: string } | null> {
  const res = await fetch("/api/v1/auth/refresh", {
    method: "POST",
    headers: { Accept: "application/json", Authorization: `Bearer ${refreshToken}` },
  });
  const d = await res.json();
  if (!d.success || !d.data?.access_token) return null;
  return { access_token: d.data.access_token, refresh_token: d.data.refresh_token };
}

function apiFetch(path: string, token: string | null, init?: RequestInit) {
  const auth = token ? `Bearer ${token}` : BASIC;
  return fetch(path, {
    ...init,
    headers: { Accept: "application/json", Authorization: auth, ...init?.headers },
  });
}

type ModalMode = "edit" | "create" | null;

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Khi 401: thử refresh token trước, nếu fail thì re-login hoàn toàn
  async function authFetch(path: string, currentToken: string | null, init?: RequestInit): Promise<Response> {
    let res = await apiFetch(path, currentToken, init);
    if (res.status !== 401) return res;

    // Thử refresh
    let newAccess: string | null = null;
    if (refreshToken) {
      const refreshed = await doRefresh(refreshToken);
      if (refreshed) {
        newAccess = refreshed.access_token;
        setToken(refreshed.access_token);
        setRefreshToken(refreshed.refresh_token);
      }
    }
    // Nếu refresh fail → re-login hoàn toàn
    if (!newAccess) {
      const creds = await doLogin();
      if (creds) {
        newAccess = creds.access_token;
        setToken(creds.access_token);
        setRefreshToken(creds.refresh_token);
      }
    }
    return apiFetch(path, newAccess, init);
  }

  async function loadProducts(t: string | null) {
    const r = await authFetch("/api/v1/admin/products?per_page=100", t);
    const d = await r.json();
    setProducts(d.data?.data ?? d.data ?? []);
  }

  useEffect(() => {
    doLogin().then(async (creds) => {
      const t = creds?.access_token ?? null;
      setToken(t);
      setRefreshToken(creds?.refresh_token ?? null);
      const [, bData] = await Promise.all([
        loadProducts(t),
        fetch("/api/v1/brands", { headers: { Accept: "application/json", Authorization: BASIC } }).then((r) => r.json()),
      ]);
      setBrands(bData.data ?? []);
      setLoading(false);
    });
  }, []);

  function set(field: keyof Form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function openEdit(p: Product) {
    setEditId(p.id);
    setForm({
      name: p.name,
      sku: p.sku,
      brand_id: String(p.brand_id),
      status: p.status,
      description: p.description ?? "",
      price: String(p.prices[0]?.amount ?? ""),
      quantity: String(p.inventory?.quantity ?? ""),
      image_url: p.image_url ?? "",
    });
    setModalMode("edit");
  }

  function openCreate() {
    setEditId(null);
    setForm({ ...EMPTY_FORM, brand_id: String(brands[0]?.id ?? 1) });
    setModalMode("create");
  }

  function closeModal() {
    setModalMode(null);
    setEditId(null);
    setSaveError(null);
  }

  async function saveEdit() {
    if (!editId) return;
    setSaving(true);
    setSaveError(null);
    const product = products.find((p) => p.id === editId);
    if (!product) {
      setSaveError("Không tìm thấy sản phẩm.");
      setSaving(false);
      return;
    }

    try {
      console.log("[saveEdit] PUT", editId, { name: form.name, price: form.price, quantity: form.quantity });
      const putRes = await authFetch(`/api/v1/admin/products/${editId}`, token, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          sku: product.sku,
          brand_id: Number(form.brand_id),
          status: form.status,
          description: form.description || null,
          ...(form.price !== "" ? { price: Number(form.price) } : {}),
          ...(form.quantity !== "" ? { quantity: Number(form.quantity) } : {}),
        }),
      });
      const putJson = await putRes.json();
      console.log("[saveEdit] PUT response", putRes.status, putJson);

      if (!putRes.ok || !putJson.success) {
        setSaveError(putJson.message ?? `Lưu thất bại (${putRes.status}), thử lại.`);
        return;
      }

      const patchRes = await authFetch(`/api/v1/admin/products/${editId}`, token, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: form.image_url || null }),
      });
      const patchJson = await patchRes.json();

      // Dùng data từ response thay vì fetch lại → tránh cache backend
      const updated = putJson.data;
      const imageUrl = patchJson.data?.image_url ?? (form.image_url || null);
      setProducts((prev) =>
        prev.map((p) =>
          p.id !== editId
            ? p
            : {
                ...p,
                name: updated?.name ?? form.name,
                brand_id: Number(form.brand_id),
                brand: { name: brands.find((b) => b.id === Number(form.brand_id))?.name ?? p.brand.name },
                status: updated?.status ?? form.status,
                description: updated?.description ?? (form.description || null),
                image_url: imageUrl,
                prices: updated?.prices?.length ? updated.prices : p.prices,
                inventory: updated?.inventory ?? p.inventory,
              }
        )
      );
      closeModal();
    } catch (err) {
      console.error("[saveEdit] error", err);
      setSaveError("Lỗi kết nối: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  }

  async function createProduct() {
    if (!form.name || !form.sku || !form.price) return;
    setSaving(true);
    setSaveError(null);

    try {
      console.log("[createProduct] POST", { name: form.name, sku: form.sku, price: form.price });
      const res = await authFetch("/api/v1/admin/products", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          sku: form.sku,
          brand_id: Number(form.brand_id),
          status: form.status,
          description: form.description || null,
          price: Number(form.price),
          quantity: Number(form.quantity),
        }),
      });
      const json = await res.json();
      console.log("[createProduct] POST response", res.status, json);

      if (!res.ok || !json.success) {
        setSaveError(json.message ?? `Tạo thất bại (${res.status}), thử lại.`);
        return;
      }

      let newProduct: Product = json.data as Product;
      if (form.image_url && newProduct.id) {
        const pr = await authFetch(`/api/v1/admin/products/${newProduct.id}`, token, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_url: form.image_url }),
        });
        const pj = await pr.json();
        if (pj.data) newProduct = { ...newProduct, image_url: pj.data.image_url };
      }
      setProducts((prev) => [newProduct, ...prev]);
      closeModal();
    } catch (err) {
      console.error("[createProduct] error", err);
      setSaveError("Lỗi kết nối: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id: number) {
    if (!confirm("Xóa sản phẩm này?")) return;
    setDeletingId(id);
    await authFetch(`/api/v1/admin/products/${id}`, token, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDeletingId(null);
  }

  const isCreateValid = form.name && form.sku && form.price && form.quantity && form.brand_id;

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalProducts   = products.length;
  const publishedCount  = products.filter((p) => p.status === "published").length;
  const outOfStockCount = products.filter((p) => (p.inventory?.quantity ?? 0) === 0).length;

  // ── Status badge helper ────────────────────────────────────────────────────
  function getStatusBadge(p: Product) {
    if ((p.inventory?.quantity ?? 0) === 0) {
      return <span className="badge out-of-stock">Hết hàng</span>;
    }
    if (p.status === "published") {
      return <span className="badge published">Published</span>;
    }
    return <span className="badge draft">Draft</span>;
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <span className="admin-loading-text">Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="admin-navbar">
        <div className="admin-navbar-logo">
          <div className="admin-navbar-logo-icon">🐾</div>
          PetCare+ Admin
        </div>
        <span className="admin-navbar-env">petcare-be · production</span>
      </nav>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main className="admin-main">
        {/* Page header */}
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Quản lý sản phẩm</h1>
            <p className="admin-page-subtitle">{totalProducts} sản phẩm trong hệ thống</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Thêm sản phẩm
          </button>
        </div>

        {/* Stats bar */}
        <div className="admin-stats-bar">
          <div className="admin-stat-card">
            <div className="admin-stat-icon blue">📦</div>
            <div>
              <div className="admin-stat-value">{totalProducts}</div>
              <div className="admin-stat-label">Tổng sản phẩm</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon green">✅</div>
            <div>
              <div className="admin-stat-value">{publishedCount}</div>
              <div className="admin-stat-label">Đang bán</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon red">⚠️</div>
            <div>
              <div className="admin-stat-value">{outOfStockCount}</div>
              <div className="admin-stat-label">Hết hàng</div>
            </div>
          </div>
        </div>

        {/* Product list */}
        {products.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">📭</div>
            <p className="admin-empty-text">Chưa có sản phẩm nào. Thêm sản phẩm đầu tiên!</p>
          </div>
        ) : (
          <div className="admin-product-list">
            {products.map((p) => (
              <div key={p.id} className="admin-product-card">
                {/* Image / icon */}
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="admin-product-thumb" />
                ) : (
                  <div className="admin-product-icon">🐾</div>
                )}

                {/* Info */}
                <div className="admin-product-info">
                  <div className="admin-product-name-row">
                    <span className="admin-product-name">{p.name}</span>
                    {getStatusBadge(p)}
                  </div>
                  <div className="admin-product-meta">
                    <span className="admin-product-brand">{p.brand?.name ?? "—"}</span>
                    <span className="admin-meta-dot">·</span>
                    <span>SKU: {p.sku}</span>
                    <span className="admin-meta-dot">·</span>
                    {p.prices[0]?.amount
                      ? <span className="admin-product-price">{p.prices[0].amount.toLocaleString("vi-VN")}đ</span>
                      : <span className="admin-product-price-missing">Chưa có giá</span>
                    }
                    <span className="admin-meta-dot">·</span>
                    <span>Kho: {p.inventory?.quantity ?? 0}</span>
                  </div>
                  {p.description && (
                    <p className="admin-product-description">{p.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="admin-product-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>
                    Sửa
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteProduct(p.id)}
                    disabled={deletingId === p.id}
                  >
                    {deletingId === p.id ? "..." : "Xóa"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Modal ────────────────────────────────────────────────────────── */}
      {modalMode && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="modal-card">
            {/* Modal header */}
            <div className="modal-header">
              <h2 className="modal-title">
                {modalMode === "create" ? "Thêm sản phẩm mới" : "Chỉnh sửa sản phẩm"}
              </h2>
              <button className="modal-close-btn" onClick={closeModal} aria-label="Đóng">
                ×
              </button>
            </div>

            {/* Modal form */}
            <div className="modal-form">
              {/* Tên */}
              <div className="form-field">
                <label className="form-label">
                  Tên sản phẩm <span className="required">*</span>
                </label>
                <input
                  className="form-input"
                  value={form.name}
                  placeholder="VD: Royal Canin Mini Adult"
                  onChange={(e) => set("name", e.target.value)}
                />
              </div>

              {/* SKU */}
              <div className="form-field">
                <label className="form-label">
                  SKU {modalMode === "create" && <span className="required">*</span>}
                </label>
                <input
                  className="form-input"
                  value={form.sku}
                  placeholder="VD: RC-MINI-001"
                  onChange={(e) => set("sku", e.target.value)}
                  disabled={modalMode === "edit"}
                />
              </div>

              {/* Brand */}
              <div className="form-field">
                <label className="form-label">
                  Thương hiệu <span className="required">*</span>
                </label>
                <select
                  className="form-select"
                  value={form.brand_id}
                  onChange={(e) => set("brand_id", e.target.value)}
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Giá + Số lượng — 2 columns */}
              <div className="form-grid-2">
                <div className="form-field">
                  <label className="form-label">
                    Giá (VND){modalMode === "create" && <span className="required"> *</span>}
                  </label>
                  <input
                    className="form-input"
                    value={form.price}
                    placeholder="VD: 320000"
                    onChange={(e) => set("price", e.target.value)}
                    type="number"
                    min="0"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">
                    Số lượng{modalMode === "create" && <span className="required"> *</span>}
                  </label>
                  <input
                    className="form-input"
                    value={form.quantity}
                    placeholder="VD: 50"
                    onChange={(e) => set("quantity", e.target.value)}
                    type="number"
                    min="0"
                  />
                </div>
              </div>

              {/* Trạng thái */}
              <div className="form-field">
                <label className="form-label">Trạng thái</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              {/* Mô tả */}
              <div className="form-field">
                <label className="form-label">Mô tả</label>
                <textarea
                  className="form-textarea"
                  value={form.description}
                  placeholder="Mô tả ngắn về sản phẩm..."
                  onChange={(e) => set("description", e.target.value)}
                />
              </div>

              {/* Ảnh */}
              <div className="form-field">
                <label className="form-label">URL ảnh sản phẩm</label>
                <input
                  className="form-input"
                  value={form.image_url}
                  placeholder="https://example.com/image.jpg"
                  onChange={(e) => set("image_url", e.target.value)}
                />
                {form.image_url && (
                  <div style={{ marginTop: 8 }}>
                    <img
                      src={form.image_url}
                      alt="preview"
                      style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1.5px solid var(--color-border)" }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {saveError && (
              <div className="modal-error">{saveError}</div>
            )}

            {/* Modal footer */}
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={closeModal} disabled={saving}>
                Hủy
              </button>
              <button
                className="btn btn-primary"
                onClick={modalMode === "create" ? createProduct : saveEdit}
                disabled={saving || (modalMode === "create" ? !isCreateValid : !form.name)}
              >
                {saving
                  ? "Đang lưu..."
                  : modalMode === "create"
                  ? "Tạo sản phẩm"
                  : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
