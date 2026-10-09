import Image from "next/image";
import Link from "next/link";

// C-01 로그인 (와이어 263:368, DIF-1-9). "먼저 둘러보기"는 OPS-1 체험하기 (카카오 없이 체험 계정으로).
export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 p-6">
      <Image src="/brand/logo-full.svg" alt="손다음" width={110} height={36} priority />
      <div className="mt-16 flex flex-col gap-3">
        <h1 className="text-3xl font-bold leading-snug">
          말하면 돌봄 기록을
          <br />써 드려요
        </h1>
        <p className="text-lg text-muted">요양보호사님이 말로 남기면 AI가 돌봄 기록과 보호자 보고서를 만들어 드려요.</p>
      </div>
      <div className="flex flex-col gap-2 rounded-[15px] bg-white p-5 shadow-[var(--shadow-card)]">
        <p className="text-lg font-bold text-accent-soft-foreground">처음이어도 괜찮아요</p>
        <ul className="flex flex-col gap-1 text-lg">
          <li>· 따로 가입하지 않아도 돼요</li>
          <li>· 보내기 전에 꼭 확인할 수 있어요</li>
          <li>· 잘못 눌러도 다시 고칠 수 있어요</li>
        </ul>
      </div>
      <div className="mt-auto flex flex-col gap-3">
        <Link href="/v1120/onboarding" className="flex h-16 items-center justify-center rounded-[15px] bg-[#FEE500] text-lg font-bold text-[#191919]">
          카카오로 시작하기
        </Link>
        <Link href="/v1120" className="flex h-16 items-center justify-center rounded-[15px] border border-border bg-white text-lg font-bold">
          먼저 둘러보기
        </Link>
        <p className="text-center text-base text-muted">둘러보기는 예시 수급자 3명으로 체험해요. 24시간 뒤 지워져요.</p>
      </div>
    </main>
  );
}
