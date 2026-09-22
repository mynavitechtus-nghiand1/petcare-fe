import "../admin.css";
import AdminSidebar from "../AdminSidebar";

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-content">{children}</div>
    </div>
  );
}
