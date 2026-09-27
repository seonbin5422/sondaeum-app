import type { ReactNode } from "react";

type ChipVariant = "outline" | "schedule" | "muted";

const variantClasses: Record<ChipVariant, string> = {
  outline: "border border-border bg-white text-muted",
  schedule: "bg-chip-schedule text-foreground",
  muted: "bg-gray-100 text-muted",
};

export function Chip({
  variant = "outline",
  className = "",
  children,
}: {
  variant?: ChipVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-[15px] px-3 py-1 text-sm font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
