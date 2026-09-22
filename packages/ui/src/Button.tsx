import React from "react";

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "outline";
  disabled?: boolean;
};

export function Button({ children, onClick, variant = "primary", disabled }: Props) {
  const base = "px-4 py-2 rounded font-medium transition-colors";
  const styles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50",
    outline: "border border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-50",
  };

  return (
    <button className={`${base} ${styles[variant]}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
