"use client";

import { useFormStatus } from "react-dom";
import { buzz, Spinner } from "../_components/Pressable";
import { markAllSeen } from "./_seen";

function Inner() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onPointerDown={buzz}
      className="press -mr-2 inline-flex min-h-12 items-center gap-2 whitespace-nowrap rounded-xl px-3 text-base font-medium text-muted active:bg-(--line)"
    >
      {pending && <Spinner />}
      {pending ? "읽는 중" : "모두 읽음"}
    </button>
  );
}

// 알림 머리 오른쪽 "모두 읽음" (흰 머리 위라 누를 때 회색 면)
export function SeenButton() {
  return (
    <form action={markAllSeen}>
      <Inner />
    </form>
  );
}
