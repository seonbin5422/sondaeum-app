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
    // 1128 수정본(558:1890): 회색 바탕 + 흰 선택 행
    <Screen>
      {/* 홈·수급자 탭·수급자 정보·방문 기록 어디서든 들어오니 들어온 화면으로 돌아간다 */}
      <TopBar back={<BackButton icon className={TOP_BACK} fallback={`/v1120/client/${id}`} />} title="서류 만들기" />
      {/* 안내와 선택 묶음 사이 12px (Figma 본문 gap) */}
      <div className="flex flex-1 flex-col gap-3">
        <header className="enter flex flex-col gap-1 py-5 pr-5 leading-[1.4]">
          <p className="text-xl font-bold">{c.name} 수급자</p>
          <p className="text-base">
            요양보호사가 보낸 기록으로 만들어요.
            <br />
            진단서나 기관이 발급하는 공식 사본은 아니에요.
          </p>
        </header>
        <DocumentPicker basePath={`/v1120/client/${id}/documents`} sentDates={sent} today={kstYmd()} />
      </div>
    </Screen>
  );
}
