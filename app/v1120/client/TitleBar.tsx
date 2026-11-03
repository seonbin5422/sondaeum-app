// 탭 화면 맨 위 흰 상단 바: 가운데 화면 이름, 뒤로 없음 (게시판·내 정보 탭과 같은 모양). 회색 Screen의 p-5를 되돌려 맨 위에 붙는다
export function TitleBar({ title }: { title: string }) {
  return (
    <div className="sticky top-0 z-10 full-bleed -mt-5 flex h-16 items-center justify-center bg-white px-16">
      <h1 className="text-center text-[22px] font-bold leading-[1.4] tracking-[-0.02em]">{title}</h1>
    </div>
  );
}
