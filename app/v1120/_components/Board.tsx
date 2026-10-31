"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { markRead } from "../_unread";
import { caregiverTitle, type BoardComment, type BoardPost } from "../_types";

// C-18 수급자 게시판 · G-02 보호자 게시판 (DIF-5, D-15 261101.ver, Figma wireframe-1120 "와이어 · C-18 수급자 게시판"·"게시글 상세").
// 목록은 글 카드(보낸 보고서 하나 = 글 하나), 이야기는 게시글 상세에서 댓글로. 최신 글이 위, 댓글은 오래된 것이 위.

const POLL_MS = 5_000;

export type Names = { caregiver: string; guardian: string };

function when(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${h < 12 ? "오전" : "오후"} ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function SmallAvatar({ name }: { name: string }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-base font-bold text-accent-soft-foreground">
      {name.slice(0, 1)}
    </span>
  );
}

function Author({ name, sub }: { name: string; sub: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <SmallAvatar name={name} />
      <span className="flex min-w-0 flex-col">
        <span className="text-base font-bold">{name}</span>
        <span className="text-base text-muted">{sub}</span>
      </span>
    </div>
  );
}

function commenter(c: BoardComment, names: Names) {
  return c.from === "caregiver" ? caregiverTitle(names.caregiver) : names.guardian;
}

// 실시간 확인: 화면을 보고 있는 동안 5초마다 서버에서 글·댓글을 다시 받는다
export function LiveRefresh() {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [router]);
  return null;
}

// 목록의 글 카드. 누르면 게시글 상세(href)
export function PostCard({ post, names, href }: { post: BoardPost; names: Names; href: string }) {
  const last = post.comments.at(-1);
  const preview = post.notes ?? post.physicalNote;
  return (
    <Link href={href} className="flex flex-col gap-3 rounded-2xl border border-(--line) bg-white px-5 pb-4 pt-5">
      <div className="flex items-center justify-between gap-2">
        <Author name={caregiverTitle(names.caregiver)} sub={when(post.at)} />
        <span className="shrink-0 whitespace-nowrap rounded-full bg-accent-soft px-3 py-0.5 text-base font-bold text-accent-soft-foreground">
          {post.kind === "summary" ? "진료 참고용 요약" : "방문 보고서"}
        </span>
      </div>
      <h2 className="text-xl font-bold">{post.title}</h2>
      {preview && <p className="line-clamp-2 text-lg">{preview}</p>}
      {last && (
        <div className="flex flex-col rounded-xl bg-(--neutral-soft) px-4 py-3">
          <span className="text-base font-bold">
            {commenter(last, names)} · {when(last.at)}
          </span>
          <span className="truncate text-base text-muted">{last.text}</span>
        </div>
      )}
      <div className="flex items-center justify-between border-t border-(--line) pt-3 text-base font-bold">
        <span className="flex items-center gap-1.5">
          <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className="shrink-0">
            <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12Z" />
          </svg>
          댓글 {post.comments.length}
        </span>
        <span className="text-muted">댓글 보기 ›</span>
      </div>
    </Link>
  );
}

// 게시글 상세의 요약. 전체(fullHref)는 보고서면 G-01, 서류면 진료 참고용 요약 화면
export function PostSummary({ post, names, fullHref }: { post: BoardPost; names: Names; fullHref: string }) {
  const doc = post.kind === "summary";
  return (
    <>
      <Author name={caregiverTitle(names.caregiver)} sub={`${when(post.at)} · ${doc ? "올린 서류" : "보낸 보고서"}`} />
      <section className="flex flex-col gap-3 rounded-2xl border border-(--line) p-5">
        {post.physicalNote && (
          <>
            <p className="text-base font-bold text-muted">한 일</p>
            <p className="text-lg">{post.physicalNote}</p>
          </>
        )}
        <p className="text-base font-bold text-muted">{doc ? "기간" : "특이사항"}</p>
        <p className="text-lg">{post.notes ?? "특이사항이 없어요."}</p>
        <Link
          href={fullHref}
          className="flex h-14 items-center justify-center rounded-[15px] border border-border bg-white text-lg font-bold"
        >
          {doc ? "요약 보기" : "보고서 전체 보기"}
        </Link>
      </section>
    </>
  );
}

type Send = (shareToken: string, text: string) => Promise<void>;

// 게시글 상세의 댓글 목록과 아래 고정 입력칸. send가 없으면 예시 화면이라 단 댓글이 이 화면에만 남는다
export function CommentThread({
  post,
  me,
  names,
  clientId,
  send,
}: {
  post: BoardPost;
  me: "caregiver" | "guardian";
  names: Names;
  clientId?: string;
  send?: Send;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [local, setLocal] = useState<BoardComment[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const comments = [...post.comments, ...local];

  // 요양보호사가 게시글을 열면 그 수급자의 보호자 댓글을 읽음으로 (메뉴바·홈·목록의 숫자가 사라짐)
  useEffect(() => {
    if (me === "caregiver" && clientId) markRead(clientId);
  }, [clientId, me]);

  async function submit() {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (send) {
        await send(post.shareToken, t);
        router.refresh();
      } else {
        setLocal([...local, { id: crypto.randomUUID(), from: me, at: new Date().toISOString(), text: t }]);
      }
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "댓글을 올리지 못했어요. 다시 해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="댓글" className="flex flex-col pb-24">
      {send && <LiveRefresh />}
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-xl font-bold">댓글 {comments.length}</h2>
        <span className="text-base text-muted">오래된 글이 위</span>
      </div>
      {comments.length === 0 && <p className="py-6 text-center text-lg text-muted">아직 댓글이 없어요. 궁금한 점을 남겨 보세요.</p>}
      <ol className="flex flex-col">
        {comments.map((c) => (
          <li key={c.id} className="flex gap-3 py-4">
            <SmallAvatar name={c.from === "caregiver" ? names.caregiver : names.guardian} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-bold">{c.from === "caregiver" ? names.caregiver : names.guardian.split(" ")[0]}</span>
                <span className="whitespace-nowrap rounded-full border border-border px-3 py-0.5 text-base font-bold text-muted">
                  {c.from === "caregiver" ? "요양보호사" : "보호자"}
                  {c.from === me && " · 나"}
                </span>
              </div>
              <span className="text-base text-muted">{when(c.at)}</span>
              <p className="whitespace-pre-wrap text-lg">{c.text}</p>
            </div>
          </li>
        ))}
      </ol>

      {/* 입력칸은 화면 아래에 고정 (Figma 게시판/댓글 입력) */}
      <form
        className="fixed inset-x-0 bottom-0 z-10 mx-auto flex w-full max-w-md gap-2 border-t border-(--line) bg-white px-4 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input
          className="h-14 min-w-0 flex-1 rounded-full bg-(--neutral-soft) px-5 text-lg placeholder:text-muted focus:outline-none focus:ring-[3px] focus:ring-accent/50"
          placeholder="댓글을 입력해 주세요"
          aria-label={`${post.title}에 댓글 쓰기`}
          maxLength={500}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" disabled={busy || !text.trim()} className="h-14 shrink-0 whitespace-nowrap rounded-[15px] bg-accent px-5 text-lg font-bold disabled:bg-(--neutral-soft) disabled:text-muted">
          올리기
        </button>
      </form>
      {error && <p className="text-base text-(--danger)">{error}</p>}
    </section>
  );
}
