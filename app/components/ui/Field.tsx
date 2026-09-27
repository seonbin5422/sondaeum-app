import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

const fieldClass =
  "h-14 rounded-[15px] border border-border bg-card px-4 text-lg font-normal placeholder:text-border";

export function Field({
  label,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-lg font-semibold">
      {label}
      <input className={`${fieldClass} ${className}`} {...props} />
    </label>
  );
}

export function SelectField({
  label,
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: ReactNode; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-lg font-semibold">
      {label}
      <select className={`${fieldClass} ${className}`} {...props}>
        {children}
      </select>
    </label>
  );
}
