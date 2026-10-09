import type { Metadata } from "next";
import "./tokens.css";

export const metadata: Metadata = {
  title: "손다음 1120",
};

export default function V1120Layout({ children }: LayoutProps<"/v1120">) {
  return <div className="v1120 flex min-h-full flex-1 flex-col bg-background">{children}</div>;
}
