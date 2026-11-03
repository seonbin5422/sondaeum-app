import { notFound } from "next/navigation";
import { kstYmd, myClient, myHistory } from "../../../_data";
import { DocumentPicker } from "../../../_components/DocumentPicker";
import { Screen, TopBar, TOP_BACK } from "../../../_components/ui";
import { BackButton } from "../../../_components/BackButton";

// C-19 서류 만들기 (D-29 초안)
export default async function DocumentsPage({ params }: PageProps<"/v1120/client/[id]/documents">) {
  const { id } = await params;
  const c = await myClient(id);
  if (!c) notFound();
  const sent = (await myHistory(id)).filter((v) => v.status === "SENT").map((v) => v.date);
  return (
    <Screen white>
      {/* 홈·수급자 탭·수급자 정보·방문 기록 어디서든 들어오니 들어온 화면으로 돌아간다 */}
      <TopBar back={<BackButton icon className={TOP_BACK} fallback={`/v1120/client/${id}`} />} title="서류 만들기" />
      <header className="enter flex flex-col gap-1 py-2 leading-[1.4]">
        <p className="text-xl font-bold">{c.name} 수급자</p>
        <p className="text-base">
          요양보호사가 보낸 기록으로 만들어요. <span className="whitespace-nowrap">진단서나 기관이 발급하는</span> 공식 사본은 아니에요.
        </p>
      </header>
      <DocumentPicker basePath={`/v1120/client/${id}/documents`} sentDates={sent} today={kstYmd()} />
    </Screen>
  );
}
