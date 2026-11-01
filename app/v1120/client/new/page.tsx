import { ClientForm } from "../../_components/ClientForm";
import { Screen, TopBar } from "../../_components/ui";

// C-07 수급자 등록
export default function NewClientPage() {
  return (
    <Screen>
      <TopBar backHref="/v1120/clients" title="수급자 등록하기" />
      <ClientForm submitLabel="등록하기" />
    </Screen>
  );
}
