"use client";
import { useState, useEffect } from "react";

type Brand = { id: number; name: string };
type Category = { id: number; name: string };
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
  categories: { id: number; name: string }[];
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
  category_ids: number[];
};

const EMPTY_FORM: Form = {
  name: "", sku: "", brand_id: "1", status: "published",
  description: "", price: "", quantity: "", image_url: "", category_ids: [],
};

type ModalMode = "edit" | "create" | null;

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/products?per_page=100").then((r) => r.json()),
      fetch("/api/admin/brands").then((r) => r.json()),
      fetch("/api/admin/categories").then((r) => r.json()),
    ]).then(([products, brands, cats]) => {
      setProducts(products.data?.data ?? products.data ?? []);
      setBrands(brands.data ?? []);
      setCategories(cats.data ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
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
      category_ids: p.categories?.map((c) => c.id) ?? [],
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
    if (!product) { setSaveError("Không tìm thấy sản phẩm."); setSaving(false); return; }

    try {
      const putRes = await fetch(`/api/admin/products/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          sku: product.sku,
          brand_id: Number(form.brand_id),
          status: form.status,
          description: form.description || null,
          category_ids: form.category_ids,
          ...(form.price !== "" ? { price: Number(form.price) } : {}),
          ...(form.quantity !== "" ? { quantity: Number(form.quantity) } : {}),
        }),
      });
      const putJson = await putRes.json();

      if (!putRes.ok || !putJson.success) {
        setSaveError(putJson.message ?? `Lưu thất bại (${putRes.status}), thử lại.`);
        return;
      }

      const patchRes = await fetch(`/api/admin/products/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: form.image_url || null }),
      });
      const patchJson = await patchRes.json();

      const updated = putJson.data;
      const imageUrl = patchJson.data?.image_url ?? (form.image_url || null);
      setProducts((prev) =>
        prev.map((p) =>
          p.id !== editId ? p : {
            ...p,
            name: updated?.name ?? form.name,
            brand_id: Number(form.brand_id),
            brand: { name: brands.find((b) => b.id === Number(form.brand_id))?.name ?? p.brand.name },
            status: updated?.status ?? form.status,
            description: updated?.description ?? (form.description || null),
            image_url: imageUrl,
            prices: updated?.prices?.length ? updated.prices : p.prices,
            inventory: updated?.inventory ?? p.inventory,
            categories: categories.filter((c) => form.category_ids.includes(c.id)),
          }
        )
      );
      closeModal();
    } catch (err) {
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
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          sku: form.sku,
          brand_id: Number(form.brand_id),
          status: form.status,
          description: form.description || null,
          category_ids: form.category_ids,
          price: Number(form.price),
          quantity: Number(form.quantity),
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setSaveError(json.message ?? `Tạo thất bại (${res.status}), thử lại.`);
        return;
      }

      let newProduct: Product = json.data as Product;
      if (form.image_url && newProduct.id) {
        const pr = await fetch(`/api/admin/products/${newProduct.id}`, {
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
      setSaveError("Lỗi kết nối: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id: number) {
    if (!confirm("Xóa sản phẩm này?")) return;
    setDeletingId(id);
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDeletingId(null);
  }

  const isCreateValid = form.name && form.sku && form.price && form.quantity && form.brand_id;

  const totalProducts   = products.length;
  const publishedCount  = products.filter((p) => p.status === "published").length;
  const outOfStockCount = products.filter((p) => (p.inventory?.quantity ?? 0) === 0).length;

  function getStatusBadge(p: Product) {
    if ((p.inventory?.quantity ?? 0) === 0) return <span className="badge out-of-stock">Hết hàng</span>;
    if (p.status === "published") return <span className="badge published">Published</span>;
    return <span className="badge draft">Draft</span>;
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <span className="admin-loading-text">Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <div className="admin-page">
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

      {products.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">📭</div>
          <p className="admin-empty-text">Chưa có sản phẩm nào. Thêm sản phẩm đầu tiên!</p>
        </div>
      ) : (
        <div className="admin-product-list">
          {products.map((p) => (
            <div key={p.id} className="admin-product-card">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="admin-product-thumb" />
              ) : (
                <div className="admin-product-icon">🐾</div>
              )}
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
                {p.description && <p className="admin-product-description">{p.description}</p>}
              </div>
              <div className="admin-product-actions">
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>Sửa</button>
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

      {modalMode && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal-card">
            <div className="modal-header">
              <h2 className="modal-title">
                {modalMode === "create" ? "Thêm sản phẩm mới" : "Chỉnh sửa sản phẩm"}
              </h2>
              <button className="modal-close-btn" onClick={closeModal} aria-label="Đóng">×</button>
            </div>

            <div className="modal-form">
              <div className="form-field">
                <label className="form-label">Tên sản phẩm <span className="required">*</span></label>
                <input className="form-input" value={form.name} placeholder="VD: Royal Canin Mini Adult" onChange={(e) => set("name", e.target.value)} />
              </div>

              <div className="form-field">
                <label className="form-label">SKU {modalMode === "create" && <span className="required">*</span>}</label>
                <input className="form-input" value={form.sku} placeholder="VD: RC-MINI-001" onChange={(e) => set("sku", e.target.value)} disabled={modalMode === "edit"} />
              </div>

              <div className="form-field">
                <label className="form-label">Thương hiệu <span className="required">*</span></label>
                <select className="form-select" value={form.brand_id} onChange={(e) => set("brand_id", e.target.value)}>
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label className="form-label">Giá (VND){modalMode === "create" && <span className="required"> *</span>}</label>
                  <input className="form-input" value={form.price} placeholder="VD: 320000" onChange={(e) => set("price", e.target.value)} type="number" min="0" />
                </div>
                <div className="form-field">
                  <label className="form-label">Số lượng{modalMode === "create" && <span className="required"> *</span>}</label>
                  <input className="form-input" value={form.quantity} placeholder="VD: 50" onChange={(e) => set("quantity", e.target.value)} type="number" min="0" />
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Trạng thái</label>
                <select className="form-select" value={form.status} onChange={(e) => set("status", e.target.value)}>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              {categories.length > 0 && (
                <div className="form-field">
                  <label className="form-label">Danh mục</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 2 }}>
                    {categories.map((c) => {
                      const checked = form.category_ids.includes(c.id);
                      return (
                        <label key={c.id} style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          padding: "5px 12px", borderRadius: 99,
                          border: `1.5px solid ${checked ? "var(--color-primary)" : "var(--color-border)"}`,
                          background: checked ? "var(--color-primary-light)" : "#fafafa",
                          color: checked ? "var(--color-primary)" : "var(--color-text-muted)",
                          fontSize: 13, fontWeight: 600, cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            style={{ display: "none" }}
                            onChange={() =>
                              setForm((f) => ({
                                ...f,
                                category_ids: checked
                                  ? f.category_ids.filter((id) => id !== c.id)
                                  : [...f.category_ids, c.id],
                              }))
                            }
                          />
                          {c.name}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="form-field">
                <label className="form-label">Mô tả</label>
                <textarea className="form-textarea" value={form.description} placeholder="Mô tả ngắn về sản phẩm..." onChange={(e) => set("description", e.target.value)} />
              </div>

              <div className="form-field">
                <label className="form-label">URL ảnh sản phẩm</label>
                <input className="form-input" value={form.image_url} placeholder="https://example.com/image.jpg" onChange={(e) => set("image_url", e.target.value)} />
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

            {saveError && <div className="modal-error">{saveError}</div>}

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={closeModal} disabled={saving}>Hủy</button>
              <button
                className="btn btn-primary"
                onClick={modalMode === "create" ? createProduct : saveEdit}
                disabled={saving || (modalMode === "create" ? !isCreateValid : !form.name)}
              >
                {saving ? "Đang lưu..." : modalMode === "create" ? "Tạo sản phẩm" : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
