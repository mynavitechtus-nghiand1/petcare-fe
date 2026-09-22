"use client";

// Component này giả lập component nặng (filter, chart, map...)
// Được lazy load — chỉ tải khi user bấm "Lọc sản phẩm"
export default function FilterPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-2xl p-6 w-full max-w-lg">
        <h2 className="text-lg font-bold mb-4">Lọc sản phẩm</h2>
        <div className="flex flex-col gap-3 mb-6">
          {["Chó", "Mèo", "Thức ăn", "Phụ kiện"].map((cat) => (
            <label key={cat} className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> {cat}
            </label>
          ))}
        </div>
        <button onClick={onClose} className="w-full py-2 bg-blue-600 text-white rounded-lg">
          Áp dụng
        </button>
      </div>
    </div>
  );
}
