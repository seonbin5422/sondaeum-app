import { requireCaregiver } from "../../_data";
import { updateMe } from "../../_actions";
import { Button, Card, Field, Screen, TopBar } from "../../_components/ui";

// C-06 내 정보 고치기 (Figma wireframe-1128 517:908). 처음 설정(C-02)과 달리 지금 값이 채워져 있고, 저장하면 내 정보로 돌아간다.
// 저장 버튼을 아래에 고정하면서도 폼 안에 두려고(대기 표시) 폼이 화면 전체를 감싼다
export default async function EditMePage() {
  const me = await requireCaregiver();
  return (
    <form action={updateMe} className="flex flex-1 flex-col">
      <Screen white bottom={<Button type="submit" pendingLabel="저장하는 중이에요">고친 내용 저장하기</Button>}>
        <TopBar backHref="/v1120/me" title="내 정보 고치기" />
        <Card className="gap-6">
          <Field label="이름 (필수)" name="name" defaultValue={me.name} required hint="보호자 보고서에 이 이름이 들어가요." />
          <Field
            label="요양보호사 자격번호 (필수)"
            name="licenseNumber"
            defaultValue={me.licenseNumber ?? ""}
            required
            hint="자격증에 적힌 번호예요."
          />
        </Card>
      </Screen>
    </form>
  );
}
