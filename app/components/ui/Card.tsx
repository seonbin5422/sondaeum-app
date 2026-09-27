import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[15px] bg-card p-6 shadow-[var(--shadow-card)] ${className}`}>
      {children}
    </div>
  );
}

export function Callout({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[15px] bg-accent-soft border border-accent/30 p-5 text-accent-soft-foreground ${className}`}>
      {children}
    </div>
  );
}
