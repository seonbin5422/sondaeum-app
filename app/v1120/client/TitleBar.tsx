// 탭 화면 맨 위 흰 상단 바 (Figma 558:1586): 왼쪽 화면 이름, 뒤로 없음 (게시판·내 정보 탭과 같은 모양). 회색 Screen의 p-5를 되돌려 맨 위에 붙는다. 넓은 화면에서도 제목이 본문 왼쪽 줄에 맞게
export function TitleBar({ title }: { title: string }) {
  return (
    <div className="sticky top-0 z-10 full-bleed -mt-5 mb-1 flex h-16 items-center bg-(--screen-bg)">
      {/* 제목은 게시판·내 정보 탭처럼 가운데 내용 칸 왼쪽 20에 (padding %는 바깥 칸 기준이라 PC에서 어긋났음) */}
      <h1 className="mx-auto w-full max-w-md px-5 text-[22px] font-bold leading-[1.4] tracking-[-0.02em]">{title}</h1>
    </div>
  );
}
