import { requireCaregiver } from "../../_data";
import { updateMe } from "../../_actions";
import { Button, Screen, TopBar } from "../../_components/ui";
import { CheckedField } from "../../_components/CheckedField";

// C-06 내 정보 고치기 (Figma 1120 수정본 558:2300). 처음 설정(C-02)과 달리 지금 값이 채워져 있고, 저장하면 내 정보로 돌아간다.
// 저장 버튼을 아래에 고정하면서도 폼 안에 두려고(대기 표시) 폼이 화면 전체를 감싼다
export default async function EditMePage() {
  const me = await requireCaregiver();
  return (
    <form action={updateMe} className="flex flex-1 flex-col">
      <Screen white bottom={<Button type="submit" pendingLabel="저장하는 중이에요">고친 내용 저장하기</Button>}>
        <TopBar backHref="/v1120/me" title="내 정보 고치기" />
        {/* 흰 바탕이라 카드 없이 입력칸만 (수정본: 입력칸이 화면 여백 20px에 바로 붙는다) */}
        <div className="enter flex flex-col gap-6">
          <CheckedField rule="name" label="이름 (필수)" name="name" defaultValue={me.name} required hint="보호자 보고서에 이 이름이 들어가요." />
          <CheckedField
            rule="license"
            label="요양보호사 자격번호 (필수)"
            name="licenseNumber"
            defaultValue={me.licenseNumber ?? ""}
            required
            hint="자격증의 '제 ○○○○-○○○○○○○ 호'에 적힌 번호예요."
          />
        </div>
      </Screen>
    </form>
  );
}
