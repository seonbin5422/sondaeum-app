import { Icon } from "../_components/ui";

export const dynamic = "force-dynamic";

// C-01 로그인 (Figma 558:854, DIF-1-9). "먼저 둘러보기"는 OPS-1 체험하기 (카카오 없이 체험 계정으로).
export default async function LoginPage() {
  // 카카오 버튼은 로그인 시작 경로로: 무작위 state를 만들고 로그인 뒤 1120 화면으로 (SEC-4)
  const authorizeUrl = "/api/auth/kakao/start?to=v1120";

  // 흰 바탕, 위는 브랜드 알약·소개, 가운데 연한 귤색 안내 상자, 아래 흰 버튼 칸
  return (
    <div className="flex flex-1 flex-col bg-white">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <header className="flex flex-col gap-5 px-6 pt-24 pb-10 leading-[1.4]">
          {/* 알약 안 "손다음" 글자는 브랜드 글꼴이라 Figma에서 글자째 내보낸 그림을 쓴다 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/v1120/login/brand-pill.svg" alt="손다음" width={133} height={58} className="rounded-full" />
          <h1 className="text-[28px] font-bold tracking-[-0.02em]">말하면 돌봄 기록을 써 드려요</h1>
          <p className="text-lg">요양보호사님이 말로 남기면 AI가 돌봄 기록과 보호자 보고서를 만들어 드려요.</p>
        </header>
        <div className="px-5 pt-5 pb-6">
          <div className="flex flex-col gap-2.5 rounded-2xl bg-(--bg-brand) p-5 text-lg leading-[1.4]">
            <p className="text-xl font-bold">처음이어도 괜찮아요</p>
            <ul className="flex flex-col gap-2.5">
              <li>따로 가입하지 않아도 돼요</li>
              <li>보내기 전에 꼭 확인할 수 있어요</li>
              <li>잘못 눌러도 다시 고칠 수 있어요</li>
            </ul>
          </div>
        </div>
        <div className="mt-auto flex flex-col gap-2 bg-white px-5 pt-4 pb-6">
          <form action="/api/auth/demo" method="post" className="flex">
            <button type="submit" className="press flex h-14 flex-1 items-center justify-center rounded-[15px] bg-(--bg-secondary) text-lg font-bold active:bg-(--line)">
              먼저 둘러보기
            </button>
          </form>
          <a href={authorizeUrl} className="press flex h-14 items-center justify-center gap-2 rounded-[15px] bg-[#FEE500] text-lg font-bold text-black/85">
            <Icon name="chat_bubble" />
            카카오로 시작하기
          </a>
          {/* Figma엔 없지만 지우지 않는다: 로그아웃해도 카카오 로그인은 브라우저에 남아 같은 계정으로 들어가서, 계정을 바꿀 땐 카카오가 다시 묻게 한다 */}
          <a href="/api/auth/kakao/start?to=v1120&switch=1" className="flex min-h-12 items-center justify-center text-base font-bold text-muted underline underline-offset-4">
            다른 카카오 계정으로 로그인
          </a>
        </div>
      </main>
    </div>
  );
}
