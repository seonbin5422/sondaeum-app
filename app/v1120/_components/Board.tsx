"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { buzz, LinkButton, PressLink, Spinner } from "./Pressable";
import { Icon } from "./Icon";
import { caregiverTitle, type BoardComment, type BoardPost } from "../_types";

// C-18 수급자 게시판 · G-02 보호자 게시판 (DIF-5, D-15 261101.ver, Figma 1120 수정본 558:2165·558:2220).
// 목록은 글 카드(보낸 보고서 하나 = 글 하나), 이야기는 게시글 상세에서 댓글로. 최신 글이 위, 댓글은 오래된 것이 위.

const POLL_MS = 5_000;

export type Names = { caregiver: string; guardian: string };

// same: 같은 날(글이 올라온 날)의 댓글이면 시각만 (Figma "오후 8:42")
function when(iso: string, same?: string) {
  const d = new Date(iso);
  const s = same && new Date(same);
  const time = `${d.getHours() < 12 ? "오전" : "오후"} ${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")}`;
  return s && s.toDateString() === d.toDateString() ? time : `${d.getMonth() + 1}월 ${d.getDate()}일 ${time}`;
}

// 아바타 이름 첫 글자. 크기·바탕은 놓인 자리마다 다르다 (Figma 40px 연한 귤색 / 댓글 36px)
function SmallAvatar({ name, className = "size-10 bg-(--bg-brand)" }: { name: string; className?: string }) {
  return <span className={`flex shrink-0 items-center justify-center rounded-full text-lg font-bold ${className}`}>{name.slice(0, 1)}</span>;
}

function Author({ name, sub }: { name: string; sub: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 leading-[1.4]">
      <SmallAvatar name={name} />
      <span className="flex min-w-0 flex-col">
        <span className="text-lg font-bold">{name}</span>
        <span className="text-base text-muted">{sub}</span>
      </span>
    </div>
  );
}

function commenter(c: BoardComment, names: Names) {
  return c.from === "caregiver" ? caregiverTitle(names.caregiver) : names.guardian;
}

// 실시간 확인: 화면을 보고 있는 동안 5초마다 서버에서 글·댓글을 다시 받는다
// 최신순·과거순 드롭다운. 휴대폰 기본 선택창이 떠서 큰 글씨로 고를 수 있다
type Sort = "new" | "old";
export function SortSelect({ value, onChange }: { value: Sort; onChange: (v: Sort) => void }) {
  return (
    <label className="relative inline-flex min-h-12 items-center rounded-xl bg-(--bg-secondary) has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-accent/50">
      <span className="sr-only">정렬</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Sort)}
        className="h-12 appearance-none bg-transparent pl-4 pr-10 text-base font-bold focus:outline-none"
      >
        <option value="new">최신순</option>
        <option value="old">과거순</option>
      </select>
      <Icon name="expand_more" className="pointer-events-none absolute right-3" />
    </label>
  );
}

// 게시판 글 목록 (C-18). posts는 최신 글이 위로 온다
export function PostList({ posts, names, me, hrefBase }: { posts: BoardPost[]; names: Names; me: "caregiver" | "guardian"; hrefBase: string }) {
  const [sort, setSort] = useState<Sort>("new");
  const list = sort === "new" ? posts : [...posts].reverse();
  // 목록 머리와 첫 카드 사이도 카드 사이처럼 12px (수정본)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between leading-[1.4]">
        <h2 className="text-lg font-bold">보고서 {posts.length}개</h2>
        <SortSelect value={sort} onChange={setSort} />
      </div>
      <ol className="flex flex-col gap-3">
        {list.map((p, i) => (
          <li key={p.shareToken} className="enter" style={{ "--i": Math.min(i, 6) } as CSSProperties}>
            <PostCard post={p} names={names} me={me} href={`${hrefBase}/${p.shareToken}`} />
          </li>
        ))}
      </ol>
    </div>
  );
}

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

// 목록의 글 카드 (Figma 517:715). 누르면 게시글 상세(href)
export function PostCard({ post, names, href, me }: { post: BoardPost; names: Names; href: string; me: "caregiver" | "guardian" }) {
  const last = post.comments.at(-1);
  const unread = post.comments.filter((c) => c.from !== me && !c.readAt).length;
  const preview = post.notes ?? post.physicalNote;
  const kind = post.kind === "summary" ? "진료 참고용 요약" : "방문 보고서";
  return (
    <PressLink href={href} pendingText={false} className="flex flex-col gap-3 rounded-2xl bg-white p-5 active:bg-(--bg-brand)">
      <Author name={caregiverTitle(names.caregiver)} sub={`${when(post.at)} · ${kind}`} />
      <h2 className="text-xl font-bold leading-[1.4]">{post.title}</h2>
      {preview && <p className="line-clamp-2 text-lg leading-[1.4]">{preview}</p>}
      {last && (
        <div className={`flex flex-col gap-0.5 rounded-2xl p-3.5 leading-[1.4] ${last.from === me ? "bg-(--bg-brand)" : "bg-(--bg-secondary)"}`}>
          <span className="text-base font-medium text-muted">
            {last.from === me ? "나" : commenter(last, names)} · <span className="whitespace-nowrap">{when(last.at, post.at)}</span>
          </span>
          <span className="line-clamp-2 text-lg">{last.text}</span>
        </div>
      )}
      <div className="flex items-center gap-2 text-base leading-[1.4]">
        <span className="whitespace-nowrap font-medium text-muted">댓글 {post.comments.length}</span>
        {unread > 0 && <span className="whitespace-nowrap rounded-full bg-(--danger-soft) px-3 py-0.5 font-bold text-(--text-danger)">새 댓글 {unread}</span>}
        <span className="ml-auto whitespace-nowrap font-bold text-(--text-brand)">{post.kind === "summary" ? "요약 보기 ›" : "보고서 보기 ›"}</span>
      </div>
    </PressLink>
  );
}

// 게시글 상세의 요약 카드 (Figma 558:2225). 흰 화면 위 회색 카드, 안의 요약 칸·버튼은 흰 면. 전체(fullHref)는 보고서면 G-01, 서류면 진료 참고용 요약 화면
export function PostSummary({ post, names, fullHref }: { post: BoardPost; names: Names; fullHref: string }) {
  const doc = post.kind === "summary";
  return (
    <section className="enter flex flex-col gap-3 rounded-2xl bg-(--bg-secondary) p-5">
      <Author name={caregiverTitle(names.caregiver)} sub={`${when(post.at)} · ${doc ? "올린 서류" : "보낸 보고서"}`} />
      {post.physicalNote && (
        // 수정본은 "식사 | 점심 반 공기"처럼 이름·값 줄. 글에 따로 저장된 값은 한 일뿐이라 한 줄
        <div className="flex justify-between gap-3 rounded-xl bg-white px-3.5 py-2 text-lg leading-[1.4]">
          <span className="shrink-0 py-1.5 text-muted">한 일</span>
          <span className="py-1.5 text-right font-bold">{post.physicalNote}</span>
        </div>
      )}
      <p className="text-base font-bold leading-[1.4] text-muted">{doc ? "기간" : "특이사항"}</p>
      <p className="text-lg leading-[1.4]">{post.notes ?? "특이사항이 없어요."}</p>
      <LinkButton href={fullHref} variant="secondary" className="bg-white! active:bg-(--line)!">
        {doc ? "요약 보기" : "보고서 전체 보기"}
      </LinkButton>
    </section>
  );
}

type Send = (shareToken: string, text: string) => Promise<void>;

// 게시글 상세의 댓글 목록과 아래 고정 입력칸 (Figma 517:792~827). send가 없으면 예시 화면이라 단 댓글이 이 화면에만 남는다
export function CommentThread({
  post,
  me,
  names,
  send,
  markRead,
}: {
  post: BoardPost;
  me: "caregiver" | "guardian";
  names: Names;
  send?: Send;
  markRead?: (shareToken: string) => Promise<void>;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [local, setLocal] = useState<BoardComment[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 화면을 연 뒤에 생긴 댓글(내가 올린 것·5초마다 받아 온 것)만 떠오르며 나타나게
  const [seen] = useState(() => new Set(post.comments.map((c) => c.id)));
  const comments = [...post.comments, ...local]; // 오래된 것부터
  const [sort, setSort] = useState<Sort>("old");
  const shown = sort === "old" ? comments : [...comments].reverse();

  // 게시글을 열어 두면 상대가 단 댓글을 읽음으로 (새 댓글이 와도 다시). 메뉴바·홈·목록의 숫자가 줄어든다
  const unread = post.comments.filter((c) => c.from !== me && !c.readAt).length;
  useEffect(() => {
    if (unread > 0) markRead?.(post.shareToken).catch(() => {});
  }, [unread, post.shareToken, markRead]);

  async function submit() {
    const t = text.trim();
    // 빈 칸에서 누르면 입력칸으로 데려간다 (버튼은 Figma처럼 늘 귤색)
    if (!t) return inputRef.current?.focus();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (send) {
        await send(post.shareToken, t);
        router.refresh();
      } else {
        setLocal([
          ...local,
          {
            id: crypto.randomUUID(),
            from: me,
            at: new Date().toISOString(),
            text: t,
            readAt: null,
          },
        ]);
      }
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "댓글을 올리지 못했어요. 다시 해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="댓글" className="flex flex-col gap-3 pb-28">
      {send && <LiveRefresh />}
      <div className="flex items-center justify-between pt-1 leading-[1.4]">
        <h2 className="text-lg font-bold">댓글 {comments.length}</h2>
        <SortSelect value={sort} onChange={setSort} />
      </div>
      {comments.length === 0 && <p className="py-6 text-center text-lg text-muted">아직 댓글이 없어요. 궁금한 점을 남겨 보세요.</p>}
      <ol className="flex flex-col gap-3">
        {shown.map((c) => {
          const mine = c.from === me;
          return (
            <li key={c.id} className={`flex flex-col gap-2 rounded-2xl p-4 ${mine ? "bg-(--bg-brand)" : ""} ${seen.has(c.id) ? "" : "enter"}`}>
              <div className="flex flex-wrap items-center gap-x-2 leading-[1.4]">
                <SmallAvatar
                  name={c.from === "caregiver" ? names.caregiver : names.guardian}
                  className={`size-9 ${mine ? "bg-white" : "bg-(--bg-secondary)"}`}
                />
                <span className="text-lg font-bold">{c.from === "caregiver" ? names.caregiver : names.guardian.split(" ")[0]}</span>
                <span className="whitespace-nowrap text-base text-muted">
                  {c.from === "caregiver" ? "요양보호사" : "보호자"}
                  {mine && " · 나"}
                </span>
                <span className="ml-auto whitespace-nowrap text-base text-muted">{when(c.at, post.at)}</span>
              </div>
              <p className="whitespace-pre-wrap text-lg leading-[1.4]">{c.text}</p>
            </li>
          );
        })}
      </ol>

      {/* 입력칸은 화면 아래에 고정 (Figma 게시판/댓글 입력). 흰 바탕은 하단 메뉴처럼 가로 끝까지, 입력칸은 내용 칸 폭 */}
      <form
        className="fixed inset-x-0 bottom-0 z-10 bg-white pb-6 pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="mx-auto flex w-full max-w-md flex-col gap-2 px-5">
          {error && (
            <p role="alert" className="text-base text-(--text-danger)">
              {error}
            </p>
          )}
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              className="h-14 min-w-0 flex-1 rounded-[15px] bg-(--bg-secondary) px-4 text-lg placeholder:text-muted focus:bg-white focus:outline-none focus:ring-[3px] focus:ring-accent/50"
              placeholder="댓글을 입력해 주세요"
              aria-label={`${post.title}에 댓글 쓰기`}
              maxLength={500}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            {/* 누르는 즉시 "올리는 중"으로 넓어지고 다시 못 누른다 */}
            <button
              type="submit"
              disabled={busy}
              aria-busy={busy || undefined}
              onPointerDown={buzz}
              className={`press flex h-14 shrink-0 items-center justify-center gap-2 rounded-[15px] bg-accent text-lg font-bold active:bg-accent-dark ${
                busy ? "px-4" : "w-14"
              }`}
            >
              {busy ? (
                <>
                  <Spinner />
                  <span className="whitespace-nowrap">올리는 중</span>
                </>
              ) : (
                <>
                  <Icon name="send" size={28} />
                  <span className="sr-only">댓글 올리기</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

// STB-5 (가): 보호자 링크 기한(90일)이 지났을 때 게시판·글·서류 자리에 보여 준다
export function BoardExpired() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 p-6 text-center leading-[1.4]">
      <h1 className="text-2xl font-bold">링크 기간이 지났어요</h1>
      <p className="text-lg text-muted">
        어르신 기록을 지키려고 링크는 받은 날부터 <span className="whitespace-nowrap">90일 동안만</span> 열려요. 요양보호사에게 새 링크를 받아 주세요.
      </p>
    </main>
  );
}
