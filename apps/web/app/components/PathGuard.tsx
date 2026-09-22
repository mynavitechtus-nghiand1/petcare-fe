"use client";
import { usePathname } from "next/navigation";

export function PathGuard({ children, path }: { children: React.ReactNode; path: string }) {
  const pathname = usePathname();
  if (pathname.startsWith(path)) return null;
  return <>{children}</>;
}
