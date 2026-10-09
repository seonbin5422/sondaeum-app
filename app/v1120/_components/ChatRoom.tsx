"use client";

import { useState } from "react";
import Link from "next/link";
import type { ChatMessage } from "../_types";

// C-18 수급자 대화방 · G-02 보호자 대화방 (DIF-5, 와이어 없음). 내 말은 오른쪽, 상대 말은 왼쪽.
// 보고서는 카드로 올라오고 누르면 보고서 화면(G-01)을 연다. 1120.ver에서는 보낸 말이 저장되지 않는다.

function time(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  return `${h < 12 ? "오전" : "오후"} ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function day(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function ChatRoom({
  me,
  initial,
  otherName,
  reportsHref,
  documentsHref,
}: {
  me: "caregiver" | "guardian";
  initial: ChatMessage[];
  otherName: string;
  reportsHref: string;
  documentsHref: string;
}) {
  const [messages, setMessages] = useState(initial);
  const [text, setText] = useState("");

  function send() {
    if (!text.trim()) return;
    setMessages([...messages, { id: crypto.randomUUID(), from: me, at: new Date().toISOString(), text: text.trim() }]);
    setText("");
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        <Link href={reportsHref} className="flex min-h-12 items-center justify-center rounded-xl border border-border text-base font-bold">
          보고서 모아보기
        </Link>
        <Link href={documentsHref} className="flex min-h-12 items-center justify-center rounded-xl border border-border text-base font-bold">
          서류 만들기
        </Link>
      </div>

      <ol className="flex flex-1 flex-col gap-3">
        {messages.length === 0 && <li className="py-10 text-center text-lg text-muted">아직 주고받은 말이 없어요. 방문 보고서를 보내면 여기에 올라와요.</li>}
        {messages.map((m, i) => {
          const mine = m.from === me;
          const d = day(m.at);
          const showDay = i === 0 || d !== day(messages[i - 1].at);
          return (
            <li key={m.id} className="flex flex-col gap-3">
              {showDay && <p className="self-center rounded-full bg-(--neutral-soft) px-3 py-0.5 text-sm text-muted">{d}</p>}
              <div className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                {m.report ? (
                  <Link
                    href={`/v1120/g/${m.report.visitId}`}
                    className="flex w-64 flex-col gap-1 rounded-2xl border border-accent bg-accent-soft p-4 text-accent-soft-foreground"
                  >
                    <span className="text-sm font-bold">방문 보고서</span>
                    <span className="text-lg font-bold text-foreground">{m.report.title}</span>
                    <span className="text-base underline underline-offset-4">눌러서 보기 ›</span>
                  </Link>
                ) : (
                  <p className={`max-w-[75%] rounded-2xl px-4 py-2 text-lg ${mine ? "bg-accent" : "bg-(--neutral-soft)"}`}>{m.text}</p>
                )}
                <span className="shrink-0 text-sm text-muted">{time(m.at)}</span>
              </div>
            </li>
          );
        })}
      </ol>

      <form
        className="sticky bottom-0 flex gap-2 bg-white py-3"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          className="h-14 flex-1 rounded-[15px] border border-border px-4 text-lg"
          placeholder={`${otherName}님께 보낼 말`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" disabled={!text.trim()} className="h-14 rounded-[15px] bg-accent px-5 text-lg font-bold disabled:bg-(--neutral-soft) disabled:text-muted">
          보내기
        </button>
      </form>
    </div>
  );
}
