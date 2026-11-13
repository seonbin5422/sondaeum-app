import type { CSSProperties } from "react";
import { requireCaregiver } from "../_data";
import { logout } from "../_actions";
import { Icon, ListRow, Screen } from "../_components/ui";
import { CoachReplay } from "../_components/Coach";
import { caregiverTitle } from "../_types";

// 내 정보 탭 (C-06 요양보호사 프로필 + 설정, Figma 1120 수정본 558:2281). 흰 바탕에 상자 없이 프로필과 메뉴 줄, 로그아웃도 메뉴 줄
export default async function MePage() {
  const { name: caregiverName, licenseNumber: caregiverLicense } = await requireCaregiver();
  return (
    <Screen nav tab white>
      <div className="sticky top-0 z-10 full-bleed -mt-5 mb-1 flex h-16 items-center bg-(--screen-bg)">
        <h1 className="mx-auto w-full max-w-md px-5 text-[22px] font-bold leading-[1.4] tracking-[-0.02em]">내 정보</h1>
      </div>
      {/* 바탕이 흰색이라 상자는 안 보이고 글자만 20px 들어간다 → 바깥 여백(20px)에 맞춰 안쪽 여백은 위아래만 */}
      <section className="enter flex items-center gap-4 py-5">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-(--bg-brand) text-[28px] font-bold">
          {caregiverName.slice(0, 1)}
        </span>
        <span className="flex min-w-0 flex-col gap-0.5 leading-[1.4]">
          <span className="text-[22px] font-bold">{caregiverTitle(caregiverName)}</span>
          <span className="text-base text-muted">
            자격번호 <span className="whitespace-nowrap">{caregiverLicense ?? "미입력"}</span>
          </span>
        </span>
      </section>
      {/* 줄 아이콘이 프로필 아바타와 같은 왼쪽 선에 오게 줄 안쪽 여백(16px)만큼 당긴다 */}
      <nav aria-label="내 정보 메뉴" className="enter -mx-4 flex flex-col" style={{ "--i": 1 } as CSSProperties}>
        <ListRow href="/v1120/me/edit" icon={<Icon name="edit" />} title="내 정보 고치기" />
        <ListRow href="/v1120/me/consent" icon={<Icon name="check_circle" />} title="동의한 내용 보기" />
        <ListRow href="/v1120/privacy" icon={<Icon name="shield" />} title="개인정보 처리방침" />
        <CoachReplay home="/v1120/tour">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-(--bg-secondary)">
            <Icon name="info" />
          </span>
          <span className="flex-1 text-lg font-bold leading-[1.4]">사용법 다시 보기</span>
          <Icon name="chevron_right" className="text-muted" />
        </CoachReplay>
        {/* 로그아웃도 같은 목록 줄 (수정본). ListRow는 링크만 받아서 같은 모양의 제출 버튼으로 */}
        <form action={logout}>
          <button type="submit" className="press flex min-h-16 w-full items-center gap-3 px-4 py-3.5 text-left active:bg-(--bg-secondary)">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-(--bg-secondary)">
              <Icon name="logout" />
            </span>
            <span className="flex-1 text-lg font-bold leading-[1.4]">로그아웃</span>
            <Icon name="chevron_right" className="text-muted" />
          </button>
        </form>
      </nav>
    </Screen>
  );
}
