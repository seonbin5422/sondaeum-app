# 시연 HTML (OPS-6, D-71)

본선 현장 시연은 **운영 PC 크롬에서 더블클릭으로 여는 HTML 파일 한 장**만 된다(배포 URL로 시연하면 실격). 이 폴더는 1120 버전 화면 전부를 그 한 장으로 묶는다.

## 만들기

```
cd ~/Desktop/sondaeum-app && DEMO_GROQ_API_KEY=<Groq 키> node scripts/demo-html/build.mjs
```

- 결과: `demo/sondaeum-demo.html` (약 5MB, `.gitignore`에 있음 — 키가 들어가므로 올리지 않는다)
- 키를 빼면 AI 없이 낱말 찾기(`_extract.ts`)로 정리한다
- 시험용으로 다른 곳에 만들 때: `DEMO_OUT=/어딘가/test.html` (키가 든 `demo/` 파일을 덮지 않게)
- 앱 코드(`app/v1120`)를 고치면 다시 만들어야 시연 파일에 들어간다

## 키
- 키가 HTML 안에 그대로 들어가 운영진에게 넘어간다 → **카드 없는 무료 Groq 계정**의 시연 전용 키를 쓰고, **심사가 끝나면 Revoke**
- 키는 채팅·메신저에 붙이지 말고 터미널에서만

## 어떻게 묶나
화면·저장 코드(`app/v1120`의 page·`_data`·`_actions`)는 **그대로** 쓰고, 서버에만 있는 것만 `shims/`로 바꾼다.

| 원래 | 시연 HTML (`shims/`) |
|---|---|
| Prisma(DB) | `prisma.ts`: 브라우저 안 작은 DB(localStorage). 화면 코드가 쓰는 Prisma 기능만 |
| 로그인 쿠키·암호화 | `session.ts`·`crypto-lib.ts`(암호화 안 함) |
| `next/navigation`·`link`·`headers`·`server`·`cache`·`image` | 주소 `#` 뒤로 화면 이동, `redirect()`는 화면 이동 신호 |
| `/api/visits/…/transcribe` | Groq Whisper 직접 호출 |
| 받아쓰기 | 크롬 브라우저 받아쓰기(배포 앱과 같음). 막히는 브라우저(사파리)는 Whisper로 |
| `public/` 그림·소리 | `window.__ASSETS`(data:)로 파일 안에 |

- 열 때 체험 계정(`app/api/auth/demo` 코드 그대로)을 만들고 가입 동의까지 마친 채 **홈부터**. 코치마크·둘러보기 권유는 끈다
- 파일을 **새로 열면** 데이터를 지우고 처음부터, **새로고침은** 그대로(`shims/fresh-start.ts`)

## 규정상 흉내만 내는 것
카카오 실제 로그인(누르면 체험 계정), 보호자 기기와 주고받기(한 브라우저 안에서만), 실제 공유 링크·카카오톡 보내기(파일 안 보호자 화면으로), 서버 정리 작업(14일 삭제 등).

## 알려진 한계
- 속삭임은 HTML에서 안 잡힌다(배포 앱은 잡힘, 원인 미확인) → 시연은 평소 목소리
- 크롬 받아쓰기·AI 정리는 인터넷이 필요하다
- 무료 키는 분당 한도가 있다 → 발표 직전 연달아 돌리지 않기

## 제출 (공지 2-4)
- 11/23(월) 23:59까지 axton@likelion.net, 제목 `[거점대학교] 팀명_발표자료제출`
- 파일 이름 `[팀명] 발표자료_형식` → 이 파일은 `[팀명] 발표자료_HTML.html`
- PPTX·PDF·HTML(·영상)을 **한 메일에 모두** 첨부. 드라이브 미리보기로는 안 열리니 받은 쪽은 내려받아 더블클릭
