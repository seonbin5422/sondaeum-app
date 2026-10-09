"use client";

// 안 읽은 메시지 수. 대화방(C-18)을 열면 그 수급자의 메시지를 읽음으로 바꾼다.
// 1120.ver에서는 읽음 상태를 이 브라우저 탭(sessionStorage)에만 둔다. API 연결 때 Message.readAt으로 바꾼다.
import { useSyncExternalStore } from "react";
import { unreadByClient } from "./_mock";

const KEY = "v1120:read";
const EVENT = "v1120:read-change";

function readSet(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function markRead(clientId: string) {
  const set = readSet();
  if (set.includes(clientId)) return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify([...set, clientId]));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// 읽은 수급자 목록을 문자열로 돌려줘야 useSyncExternalStore가 매번 새 값으로 보지 않는다
const snapshot = () => (typeof window === "undefined" ? "[]" : (sessionStorage.getItem(KEY) ?? "[]"));

function useReadIds(): string[] {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "[]");
  return JSON.parse(raw) as string[];
}

export function useUnread(clientId: string) {
  const read = useReadIds();
  return read.includes(clientId) ? 0 : (unreadByClient[clientId] ?? 0);
}

export function useTotalUnread() {
  const read = useReadIds();
  return Object.entries(unreadByClient).reduce((sum, [id, n]) => sum + (read.includes(id) ? 0 : n), 0);
}
