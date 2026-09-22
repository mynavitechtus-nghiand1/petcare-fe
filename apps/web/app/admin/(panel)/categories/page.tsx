"use client";
import { useState, useEffect } from "react";

type Category = {
  id: number;
  name: string;
  sort_order: number;
  is_active: boolean;
};

type CategoryForm = {
  name: string;
  sort_order: string;
  is_active: boolean;
};

const EMPTY_FORM: CategoryForm = { name: "", sort_order: "0", is_active: true };
type ModalMode = "create" | "edit" | null;

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => {
        setCategories(d.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditId(null);
    const maxOrder = categories.length > 0 ? Math.max(...categories.map((c) => c.sort_order)) + 1 : 1;
    setForm({ ...EMPTY_FORM, sort_order: String(maxOrder) });
    setModalMode("create");
  }

  function openEdit(c: Category) {
    setEditId(c.id);
    setForm({ name: c.name, sort_order: String(c.sort_order), is_active: c.is_active });
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setEditId(null);
    setSaveError(null);
  }

  async function saveCategory() {
    setSaving(true);
    setSaveError(null);
    const payload = {
      name: form.name,
      sort_order: Number(form.sort_order),
      is_active: form.is_active,
    };
    try {
      if (modalMode === "create") {
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          setSaveError(json.message ?? `Tạo thất bại (${res.status})`);
          return;
        }
        setCategories((prev) => [...prev, json.data as Category].sort((a, b) => a.sort_order - b.sort_order));
      } else if (modalMode === "edit" && editId) {
        const res = await fetch(`/api/admin/categories/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          setSaveError(json.message ?? `Lưu thất bại (${res.status})`);
          return;
        }
        setCategories((prev) =>
          prev
            .map((c) => (c.id === editId ? { ...c, ...payload } : c))
            .sort((a, b) => a.sort_order - b.sort_order)
        );
      }
      closeModal();
    } catch (err) {
      setSaveError("Lỗi kết nối: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(id: number) {
    if (!confirm("Xóa/vô hiệu hoá danh mục này?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  const activeCount   = categories.filter((c) => c.is_active).length;
  const inactiveCount = categories.filter((c) => !c.is_active).length;

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <span className="admin-loading-text">Đang tải danh mục...</span>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Quản lý danh mục</h1>
          <p className="admin-page-subtitle">{categories.length} danh mục · {activeCount} active · {inactiveCount} inactive</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Thêm danh mục
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">📂</div>
          <p className="admin-empty-text">Chưa có danh mục nào.</p>
        </div>
      ) : (
        <div className="admin-list">
          {categories.map((c) => (
            <div key={c.id} className="admin-list-card">
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, flexShrink: 0,
              }}>
                📂
              </div>
              <div className="admin-list-card-info">
                <div className="admin-list-card-name">{c.name}</div>
                <div className="admin-list-card-meta">Thứ tự: {c.sort_order}</div>
              </div>
              <span className={`badge ${c.is_active ? "active" : "inactive"}`}>
                {c.is_active ? "Active" : "Inactive"}
              </span>
              <div className="admin-list-card-actions">
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(c)}>Sửa</button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => deleteCategory(c.id)}
                  disabled={deletingId === c.id}
                >
                  {deletingId === c.id ? "..." : "Xóa"}
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
                {modalMode === "create" ? "Thêm danh mục mới" : "Chỉnh sửa danh mục"}
              </h2>
              <button className="modal-close-btn" onClick={closeModal} aria-label="Đóng">×</button>
            </div>

            <div className="modal-form">
              <div className="form-field">
                <label className="form-label">Tên danh mục <span className="required">*</span></label>
                <input
                  className="form-input"
                  value={form.name}
                  placeholder="VD: Thức ăn cho chó"
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  autoFocus
                />
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label className="form-label">Thứ tự sắp xếp</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    value={form.sort_order}
                    onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
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
            </div>

            {saveError && <div className="modal-error">{saveError}</div>}

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={closeModal} disabled={saving}>Hủy</button>
              <button
                className="btn btn-primary"
                onClick={saveCategory}
                disabled={saving || !form.name.trim()}
              >
                {saving ? "Đang lưu..." : modalMode === "create" ? "Tạo danh mục" : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
