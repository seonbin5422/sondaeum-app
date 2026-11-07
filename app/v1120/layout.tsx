import type { Metadata, Viewport } from "next";
import "./tokens.css";

export const metadata: Metadata = {
  title: "손다음",
};

// 휴대폰 맨 위 시간·배터리 줄 색: 화면 바탕(회색)과 같게. 귤색 머리가 있는 홈은 page.tsx에서 귤색으로 덮는다
export const viewport: Viewport = { themeColor: "#f4f4f4" };

export default function V1120Layout({ children }: LayoutProps<"/v1120">) {
  return <div className="v1120 flex min-h-full flex-1 flex-col bg-(--bg-secondary)">{children}</div>;
}
