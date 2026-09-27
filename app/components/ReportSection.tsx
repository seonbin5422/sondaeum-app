import type { ReactNode } from "react";

export function ReportSection({
  icon,
  label,
  value,
  onChange,
  readOnly,
  warning,
  placeholder,
  extra,
}: {
  icon: string;
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  warning?: string;
  placeholder?: string;
  extra?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-lg font-bold">{label}</span>
      </div>
      {extra}
      {readOnly ? (
        <p className="whitespace-pre-wrap text-lg leading-relaxed">{value}</p>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="min-h-[80px] w-full resize-none rounded-xl border border-border bg-background p-3 text-lg leading-relaxed"
        />
      )}
      {warning && <p className="mt-2 text-base font-semibold text-amber-600">{warning}</p>}
    </div>
  );
}
