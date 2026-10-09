import { GuardianReport } from "./GuardianReport";

export default async function GuardianReportPage({ params, searchParams }: PageProps<"/v1120/g/[token]">) {
  const { token } = await params;
  const { order } = await searchParams;
  return <GuardianReport token={token} order={order === "improved" ? "improved" : "base"} />;
}
