export function Avatar({ name, className = "" }: { name: string; className?: string }) {
  const initial = name.trim().charAt(0) || "?";
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-accent-soft text-2xl font-bold text-accent-soft-foreground ${className}`}
    >
      {initial}
    </div>
  );
}
