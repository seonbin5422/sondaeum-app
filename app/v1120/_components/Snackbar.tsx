"use client";

import { useEffect, useState } from "react";
import { Button } from "./Pressable";

// 중요한 일을 한 뒤 "~했어요"와 되돌리기를 화면 아래에 잠깐 보여 준다 (사용자 11/14).
// 서버 동작이 ?done=으로 돌려보낸 화면에서 띄운다. 60대 사용자가 읽고 누를 수 있게 10초 둔다
export function Snackbar({ message, undo, undoLabel = "되돌리기" }: { message: string; undo?: () => Promise<void>; undoLabel?: string }) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    // 새로고침하면 다시 뜨지 않게 주소의 ?done=을 지운다 (화면은 다시 그리지 않음)
    const url = new URL(location.href);
    url.searchParams.delete("done");
    url.searchParams.delete("id");
    history.replaceState(history.state, "", url);
    const t = setTimeout(() => setOpen(false), 10_000);
    return () => clearTimeout(t);
  }, []);
  if (!open) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(88px+env(safe-area-inset-bottom))] z-30 px-4">
      <div role="status" className="enter pointer-events-auto mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-foreground py-2 pl-5 pr-2 text-white">
        <p className="min-w-0 flex-1 py-2 text-lg leading-[1.4]">{message}</p>
        {undo && (
          <form action={undo} className="shrink-0">
            <Button type="submit" pendingLabel="되돌리는 중" className="h-12! w-auto! bg-transparent! px-3 text-accent! active:bg-white/15!">
              {undoLabel}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
