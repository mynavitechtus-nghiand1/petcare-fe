"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@petcare/ui";

type Props = {
  productId: number;
  variant?: "primary" | "outline";
  label?: string;
};

export function AddToCartButton({
  productId,
  variant = "primary",
  label = "Thêm vào giỏ",
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleClick() {
    setStatus("loading");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, quantity: 1 }),
      });
      if (res.status === 401) {
        window.location.href = `/login?from=/catalog/${productId}`;
        return;
      }
      if (!res.ok) throw new Error();
      setStatus("done");
      router.refresh(); // cập nhật badge navbar
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  }

  if (status === "done") {
    return (
      <Link
        href="/cart"
        className="block w-full text-center px-4 py-2 rounded text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
      >
        ✓ Xem giỏ hàng →
      </Link>
    );
  }

  return (
    <Button variant={variant} onClick={handleClick} disabled={status === "loading"}>
      {status === "loading" ? "Đang thêm..." : status === "error" ? "Thử lại" : label}
    </Button>
  );
}
