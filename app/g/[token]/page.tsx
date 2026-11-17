import { redirect } from "next/navigation";

// 옛 보호자 링크(/g/…)는 기한·보호자 확인이 있는 1120 화면으로 보낸다
export default async function GuardianPage({ params }: PageProps<"/g/[token]">) {
  const { token } = await params;
  redirect(`/v1120/g/${token}`);
}
