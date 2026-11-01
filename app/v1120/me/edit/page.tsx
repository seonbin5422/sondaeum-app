import { requireCaregiver } from "../../_data";
import { updateMe } from "../../_actions";
import { Button, Field, Screen, TopBar } from "../../_components/ui";

// C-06 내 정보 고치기. 처음 설정(C-02)과 달리 지금 값이 채워져 있고, 저장하면 내 정보로 돌아간다.
export default async function EditMePage() {
  const me = await requireCaregiver();
  return (
    <Screen>
      <TopBar backHref="/v1120/me" title="내 정보 고치기" />
      <form action={updateMe} className="flex flex-col gap-5">
        <Field label="이름 (필수)" name="name" defaultValue={me.name} required />
        <Field
          label="요양보호사 자격번호 (필수)"
          name="licenseNumber"
          defaultValue={me.licenseNumber ?? ""}
          required
          hint="자격증에 적힌 번호예요."
        />
        <Button type="submit">고친 내용 저장하기</Button>
      </form>
    </Screen>
  );
}
