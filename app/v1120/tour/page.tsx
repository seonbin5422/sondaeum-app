import { requireCaregiver } from "../_data";
import { Tour } from "./Tour";

// 사용법 둘러보기 (D-57 261114.ver): 수급자를 처음 등록한 뒤, 또는 내 정보 "사용법 다시 보기"
export default async function TourPage() {
  await requireCaregiver();
  return <Tour />;
}
