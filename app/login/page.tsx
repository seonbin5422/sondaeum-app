import { headers } from "next/headers";
import { Logo } from "@/app/components/ui/Logo";
import { buildAuthorizeUrl } from "@/lib/kakaoAuth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http:" : "https:";
  const redirectUri = `${protocol}//${host}/api/auth/kakao/callback`;
  const authorizeUrl = buildAuthorizeUrl({ state: "login", redirectUri });

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center p-6">
      <div className="flex w-full flex-col items-center gap-8 rounded-[20px] bg-card p-10 text-center shadow-[var(--shadow-card)]">
        <Logo className="h-12" />
        <div className="flex flex-col gap-2">
          <p className="text-xl font-semibold text-foreground">요양보호사 로그인</p>
          <p className="text-sm text-muted">카카오계정으로 간편하게 로그인하세요</p>
        </div>
        <a
          href={authorizeUrl}
          className="flex h-16 w-full items-center justify-center rounded-[15px] bg-[#FEE500] text-lg font-semibold text-[#191919] shadow-[var(--shadow-card)] active:brightness-95"
        >
          카카오로 로그인
        </a>
      </div>
    </div>
  );
}
