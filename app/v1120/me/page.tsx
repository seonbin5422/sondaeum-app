import type { CSSProperties } from "react";
import { requireCaregiver } from "../_data";
import { logout } from "../_actions";
import { Button, Icon, ListRow, Screen } from "../_components/ui";
import { caregiverTitle } from "../_types";

// 내 정보 탭 (C-06 요양보호사 프로필 + 설정, Figma wireframe-1128 517:829). 흰 상단 바 아래 회색 바탕에 흰 카드
export default async function MePage() {
  const { name: caregiverName, licenseNumber: caregiverLicense } = await requireCaregiver();
  return (
    <Screen nav tab>
      <div className="full-bleed -mt-5 flex h-16 items-center justify-center bg-white px-16">
        <h1 className="text-center text-[22px] font-bold leading-[1.4] tracking-[-0.02em]">내 정보</h1>
      </div>
      <section className="enter flex items-center gap-4 rounded-2xl bg-white p-5">
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
      <nav aria-label="내 정보 메뉴" className="enter flex flex-col overflow-hidden rounded-2xl bg-white p-1" style={{ "--i": 1 } as CSSProperties}>
        <ListRow href="/v1120/me/edit" icon={<Icon name="edit" />} title="내 정보 고치기" />
        <ListRow href="/v1120/me/consent" icon={<Icon name="check_circle" />} title="동의한 내용 보기" />
        <ListRow href="/v1120/privacy" icon={<Icon name="shield" />} title="개인정보 처리방침" />
      </nav>
      <form action={logout} className="enter" style={{ "--i": 2 } as CSSProperties}>
        <Button type="submit" variant="danger" pendingLabel="로그아웃 중이에요">
          <Icon name="logout" />
          로그아웃
        </Button>
      </form>
    </Screen>
  );
}
