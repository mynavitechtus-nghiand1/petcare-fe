"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

type Category = { id: number; name: string; slug: string };

type Props = { categories: Category[] };

export function CatalogClient({ categories }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  const currentCategoryId = searchParams.get("category_id") ?? "";

  function buildUrl(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    return `/catalog?${params.toString()}`;
  }

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      startTransition(() => router.push(buildUrl({ q, page: "" })));
    },
    [q, searchParams]
  );

  function setCategory(id: string) {
    startTransition(() => router.push(buildUrl({ category_id: id, page: "" })));
  }

  return (
    <div className="mb-8 space-y-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm kiếm sản phẩm..."
          className="flex-1 px-4 py-2 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-blue-400 bg-white"
        />
        <button
          type="submit"
          className="px-5 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={isPending}
        >
          {isPending ? "..." : "Tìm"}
        </button>
      </form>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setCategory("")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            !currentCategoryId
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-slate-600 border-slate-200 hover:border-blue-400"
          }`}
        >
          Tất cả
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(String(c.id))}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              currentCategoryId === String(c.id)
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-blue-400"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}
