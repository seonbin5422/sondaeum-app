import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { guardianBoard, guardianHistory, kstYmd, toProfile } from "../../../_data";
import { SummaryView } from "../../../_components/DocumentViews";

// G-02 게시판에 올라온 진료 참고용 요약 (보호자, 로그인 없이 그 서류 링크로). 요양보호사 C-20과 같은 화면, 올리기 버튼만 없다
export default async function GuardianDocumentPage({ params }: PageProps<"/v1120/g/[token]/document">) {
  const { token } = await params;
  const b = await guardianBoard(token);
  const post = b?.posts.find((p) => p.shareToken === token);
  if (!b || !post?.period) notFound();
  const client = await prisma.client.findUnique({ where: { id: b.clientId } });
  if (!client) notFound();
  return (
    <SummaryView
      client={toProfile(client)}
      history={await guardianHistory(b.clientId)}
      caregiverName={b.caregiverName}
      today={kstYmd()}
      from={post.period.from}
      to={post.period.to}
      backHref={`/v1120/g/${token}/post`}
      role="guardian"
    />
  );
}
