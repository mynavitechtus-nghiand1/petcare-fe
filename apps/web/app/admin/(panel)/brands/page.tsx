"use client";
import { useState, useEffect } from "react";

type Brand = {
  id: number;
  name: string;
  is_active: boolean;
  products_count?: number;
};

type BrandForm = {
  name: string;
  is_active: boolean;
};

const EMPTY_FORM: BrandForm = { name: "", is_active: true };
type ModalMode = "create" | "edit" | null;

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<BrandForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/brands")
      .then((r) => r.json())
      .then((d) => {
        setBrands(d.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setModalMode("create");
  }

  function openEdit(b: Brand) {
    setEditId(b.id);
    setForm({ name: b.name, is_active: b.is_active });
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setEditId(null);
    setSaveError(null);
  }

  async function saveBrand() {
    setSaving(true);
    setSaveError(null);
    try {
      if (modalMode === "create") {
        const res = await fetch("/api/admin/brands", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, is_active: form.is_active }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          setSaveError(json.message ?? `Tạo thất bại (${res.status})`);
          return;
        }
        setBrands((prev) => [json.data as Brand, ...prev]);
      } else if (modalMode === "edit" && editId) {
        const res = await fetch(`/api/admin/brands/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, is_active: form.is_active }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          setSaveError(json.message ?? `Lưu thất bại (${res.status})`);
          return;
        }
        setBrands((prev) =>
          prev.map((b) =>
            b.id === editId ? { ...b, name: form.name, is_active: form.is_active } : b
          )
        );
      }
      closeModal();
    } catch (err) {
      setSaveError("Lỗi kết nối: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  }

  async function deleteBrand(id: number) {
    if (!confirm("Xóa/vô hiệu hoá thương hiệu này?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/admin/brands/${id}`, { method: "DELETE" });
      setBrands((prev) => prev.filter((b) => b.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  const activeCount   = brands.filter((b) => b.is_active).length;
  const inactiveCount = brands.filter((b) => !b.is_active).length;

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <span className="admin-loading-text">Đang tải thương hiệu...</span>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Quản lý thương hiệu</h1>
          <p className="admin-page-subtitle">{brands.length} thương hiệu · {activeCount} active · {inactiveCount} inactive</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Thêm thương hiệu
        </button>
      </div>

      {brands.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">🏷️</div>
          <p className="admin-empty-text">Chưa có thương hiệu nào.</p>
        </div>
      ) : (
        <div className="admin-list">
          {brands.map((b) => (
            <div key={b.id} className="admin-list-card">
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: "linear-gradient(135deg, #eff6ff, #eef2ff)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, flexShrink: 0,
              }}>
                🏷️
              </div>
              <div className="admin-list-card-info">
                <div className="admin-list-card-name">{b.name}</div>
                <div className="admin-list-card-meta">
                  {b.products_count !== undefined && (
                    <span style={{ marginRight: 8 }}>{b.products_count} sản phẩm</span>
                  )}
                </div>
              </div>
              <span className={`badge ${b.is_active ? "active" : "inactive"}`}>
                {b.is_active ? "Active" : "Inactive"}
              </span>
              <div className="admin-list-card-actions">
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(b)}>Sửa</button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => deleteBrand(b.id)}
                  disabled={deletingId === b.id}
                >
                  {deletingId === b.id ? "..." : "Xóa"}
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
                {modalMode === "create" ? "Thêm thương hiệu mới" : "Chỉnh sửa thương hiệu"}
              </h2>
              <button className="modal-close-btn" onClick={closeModal} aria-label="Đóng">×</button>
            </div>

            <div className="modal-form">
              <div className="form-field">
                <label className="form-label">Tên thương hiệu <span className="required">*</span></label>
                <input
                  className="form-input"
                  value={form.name}
                  placeholder="VD: Royal Canin"
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  autoFocus
                />
              </div>

              <div className="form-field">
                <label className="form-label">Trạng thái</label>
                <select
                  className="form-select"
                  value={form.is_active ? "1" : "0"}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value === "1" }))}
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>
            </div>

            {saveError && <div className="modal-error">{saveError}</div>}

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={closeModal} disabled={saving}>Hủy</button>
              <button
                className="btn btn-primary"
                onClick={saveBrand}
                disabled={saving || !form.name.trim()}
              >
                {saving ? "Đang lưu..." : modalMode === "create" ? "Tạo thương hiệu" : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
