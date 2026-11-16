// 파일을 눌러 열 때마다 처음 들어온 것처럼: 데이터·로그인·코치마크 본 기록을 지우고 로그인 화면부터 (사용자 11/17).
// 새로고침·뒤로 가기로 다시 열린 것은 그대로 둔다(시연 중 실수로 새로고침해도 이어서 하게)
const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
if (nav?.type !== "reload" && nav?.type !== "back_forward") {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {}
  history.replaceState(null, "", location.pathname);
}
