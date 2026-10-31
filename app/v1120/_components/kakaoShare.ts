// 카카오톡 공유 카드 (D-34, Figma "카카오 공유 카드"): 피드 템플릿 = 이미지 + 제목 + 설명 + 버튼 하나.
// 화면을 열 때 SDK를 미리 불러 두고(preloadKakao), 버튼을 누르면 바로 보낸다. 키가 없거나 SDK가 없으면 false → 부르는 쪽이 공유 창·복사로 넘어간다.
// 카드에는 건강 정보를 넣지 않는다(카카오 서버를 거침): 날짜·성+○○·요양보호사 이름까지만.

const SDK = "https://developers.kakao.com/sdk/js/kakao.min.js";

function kakaoKey() {
  // NEXT_PUBLIC_ 값은 빌드 때 그대로 박히므로 BOM·공백을 여기서 지운다 (ShareLinkButton과 같은 함정)
  return process.env.NEXT_PUBLIC_KAKAO_JS_KEY?.replace(/﻿/g, "").trim();
}

function init() {
  const key = kakaoKey();
  if (key && window.Kakao && !window.Kakao.isInitialized()) window.Kakao.init(key);
}

export function preloadKakao() {
  if (!kakaoKey() || window.Kakao) return init();
  if (document.querySelector(`script[src="${SDK}"]`)) return;
  const s = document.createElement("script");
  s.src = SDK;
  s.async = true;
  s.onload = init;
  document.head.appendChild(s);
}

export function shareKakaoCard(o: { title: string; description: string; image: "report" | "board"; url: string; button: string }): boolean {
  if (!window.Kakao?.isInitialized()) return false;
  const link = { mobileWebUrl: o.url, webUrl: o.url };
  try {
    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: { title: o.title, description: o.description, imageUrl: `${location.origin}/brand/share-${o.image}.png`, imageWidth: 800, imageHeight: 400, link },
      buttons: [{ title: o.button, link }],
    });
    return true;
  } catch {
    // PC는 팝업 창 방식이라 팝업이 막히면 여기로 온다 → 공유 창·복사로
    return false;
  }
}
