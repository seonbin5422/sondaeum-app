"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import { checkField, type Rule } from "../_validate";

// Field(ui.tsx)와 같은 모양 + 형식 검사. 칸을 벗어나면 틀린 이유를 빨간 글씨로, 틀린 채 제출하면 브라우저 알림으로 막는다(setCustomValidity).
// 서버 화면에서도 쓰도록 검사는 함수 대신 규칙 이름(rule)으로 받는다
export function CheckedField({
  label,
  hint,
  rule,
  onChange,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; rule: Rule }) {
  const id = useId();
  const [value, setValue] = useState(String(props.value ?? props.defaultValue ?? ""));
  const [touched, setTouched] = useState(false);
  const error = checkField(rule, String(props.value ?? value));
  const show = touched && error;
  return (
    <label className="flex flex-col gap-2">
      <span className="text-lg font-bold">{label}</span>
      <input
        className={`h-14 rounded-[15px] bg-(--bg-secondary) px-4 text-lg transition-shadow placeholder:text-muted focus:bg-white focus:outline-none focus:ring-[3px] ${show ? "ring-[3px] ring-(--text-danger)/60 focus:ring-(--text-danger)/60" : "focus:ring-accent/50"}`}
        aria-invalid={!!show}
        aria-describedby={`${id}-msg`}
        ref={(el) => el?.setCustomValidity(error ?? "")}
        onChange={(e) => {
          setValue(e.target.value);
          onChange?.(e);
        }}
        onBlur={() => setTouched(true)}
        onInvalid={() => setTouched(true)}
        {...props}
      />
      {show ? (
        <span id={`${id}-msg`} role="alert" className="text-base font-bold text-(--text-danger)">
          {error}
        </span>
      ) : (
        hint && <span id={`${id}-msg`} className="text-base text-muted">{hint}</span>
      )}
    </label>
  );
}
