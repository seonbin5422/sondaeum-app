"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Icon, Screen, TopBar } from "../../../_components/ui";
import { deleteClient, permanentDeleteClient } from "../../../_actions";

const at = (i: number) => ({ "--i": i }) as CSSProperties;

// C-10 삭제 확인 (Figma 558:1849) · C-11 완전히 지우기 (Figma 558:1870). 둘 다 흰 바탕, 상단 바는 뒤로만
export function DeleteSteps({ id, name, permanent, backHref }: { id: string; name: string; permanent: boolean; backHref: string }) {
  const router = useRouter();
  const [moved, setMoved] = useState(false);
  const [typed, setTyped] = useState("");

  if (!permanent) {
    return (
      <Screen
        white
        bottom={
          <>
            <form action={deleteClient.bind(null, id)} className="flex">
              <Button type="submit" variant="danger" pendingLabel="지우는 중이에요">
                삭제하기
              </Button>
            </form>
            <Button variant="secondary" onClick={() => router.back()}>
              취소
            </Button>
          </>
        }
      >
        <TopBar backHref={backHref} />
        <div className="pt-6" style={at(0)}>
          <Card className="p-6">
            <span className="flex size-[72px] items-center justify-center rounded-full bg-(--danger-soft) text-(--danger)">
              <Icon name="delete" size={36} />
            </span>
            <h1 className="text-2xl font-bold leading-[1.4]">
              {name} <span className="whitespace-nowrap">정보를 삭제할까요?</span>
            </h1>
            <ul className="text-lg leading-[1.4]">
              <li>목록과 홈에서 보이지 않아요.</li>
              <li>
                14일 동안은 수급자 탭 아래 <span className="whitespace-nowrap">&quot;삭제한 수급자&quot;에서</span> 되살릴 수 있어요.
              </li>
              <li>보호자 게시판 링크는 바로 닫혀요.</li>
            </ul>
          </Card>
        </div>
      </Screen>
    );
  }

  const ok = moved && typed.trim() === name;
  return (
    <Screen
      white
      bottom={
        <form action={permanentDeleteClient.bind(null, id)} className="flex">
          <Button
            type="submit"
            variant="danger"
            pendingLabel="지우는 중이에요"
            disabled={!ok}
            disabledReason={!moved ? "기관 시스템에 옮겼는지 먼저 확인해 주세요" : "수급자 이름을 똑같이 적어 주세요"}
          >
            완전히 지우기
          </Button>
        </form>
      }
    >
      <TopBar backHref={backHref} />
      {/* Figma 본문: 블록 사이 12px */}
      <div className="flex flex-col gap-3 pt-1">
      <div style={at(0)}>
        <Card className="gap-2 px-5 py-6">
          <h1 className="text-2xl font-bold leading-[1.4]">
            {name} 수급자 기록을 <span className="whitespace-nowrap">완전히 지울까요?</span>
          </h1>
          <p className="text-lg leading-[1.4] text-muted">
            방문 기록, 보고서, 게시판 글과 댓글이
            <br />
            모두 지워지고 되살릴 수 없어요.
          </p>
        </Card>
      </div>
      <section className="enter flex flex-col gap-2 rounded-2xl bg-(--danger-soft) p-5" style={at(1)}>
        <p className="flex items-center gap-2 text-lg font-bold text-(--text-danger)">
          <Icon name="error" className="text-(--danger)" />
          먼저 확인해 주세요
        </p>
        <p className="text-lg">급여제공기록은 기관이 5년 동안 보관해야 해요. 필요한 기록을 기관 시스템에 옮겼는지 확인해 주세요.</p>
      </section>
      {/* 공통/동의 항목: 줄 전체가 누름 영역, 고르면 바로 아이콘이 바뀐다 */}
      <div style={at(2)}>
        <Card className="p-1">
          <label className="press flex min-h-12 cursor-pointer items-center gap-3 rounded-xl p-4 text-lg font-bold active:bg-(--bg-secondary)">
            <input type="checkbox" className="sr-only" checked={moved} onChange={(e) => setMoved(e.target.checked)} />
            <Icon
              name={moved ? "check_circle" : "radio_button_unchecked"}
              size={32}
              className={moved ? "pop text-(--brand-secondary)" : "text-(--line)"}
            />
            기관 시스템에 옮겼어요
          </label>
        </Card>
      </div>
      <div style={at(3)}>
        <Card>
          <label className="flex flex-col gap-2">
            <span className="text-lg font-bold">확인을 위해 수급자 이름을 적어 주세요</span>
            <input
              className="h-14 rounded-[15px] bg-(--bg-secondary) px-4 text-lg placeholder:text-muted focus:bg-white focus:outline-none focus:ring-[3px] focus:ring-accent/50"
              value={typed}
              placeholder={name}
              onChange={(e) => setTyped(e.target.value)}
            />
          </label>
        </Card>
      </div>
      </div>
    </Screen>
  );
}
