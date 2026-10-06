# 04. Figma 연동 (Figma MCP)

Claude Code에 Figma MCP를 연결해서 **화면 ID ↔ Figma 프레임 ↔ 코드**를 한 번에 오가게 한다. Figma 렌더링 이미지를 페르소나 평가에 쓰고, 디자인 담당이 이 연동으로 화면 구현까지 직접 한다 ([../prd/decisions.md](../prd/decisions.md) D-21).

## 준비

1. Claude Code에서 Figma 플러그인(MCP)을 켜고 Figma 계정으로 인증한다.
2. Figma 파일의 프레임 이름을 화면 ID로 맞춘다. 예: `C-12 기록`, `G-01 보호자 보고서`. ([02-screens.md](02-screens.md))
3. 각 프레임의 링크(`node-id`가 붙은 URL)를 [02-screens.md](02-screens.md)의 `Figma 프레임` 칸에 붙인다.

## 자주 쓰는 요청

| 하려는 일 | Claude Code에 이렇게 요청 |
| --- | --- |
| 화면 연결 | "docs/design/02-screens.md의 화면마다 Figma 파일 `<URL>`에서 같은 이름의 프레임을 찾아 링크를 채워줘" |
| Figma 렌더링 보기 | "C-12 프레임을 렌더링해서 보여주고, 지금 `RecordScreen.tsx` 화면과 다른 점을 표로 정리해줘" |
| 페르소나 평가 | "C-12 Figma 렌더링으로 `/ux-persona-review C-12` 실행해줘" |
| 디자인 → 코드 | "C-14 프레임대로 `ReviewForm.tsx`를 고쳐줘. 색·크기는 `globals.css` 토큰만 써줘" |
| 코드 → 디자인 | "지금 코드의 C-17 서류 초안 화면을 Figma에 새 프레임으로 만들어줘" |
| 토큰 맞추기 | "Figma 변수와 `docs/design/01-design-system.md`의 색 토큰을 비교해서 다른 값만 알려줘" |

## 규칙

- 기준은 **코드**다. Figma와 코드가 다르면 어느 쪽이 맞는지 디자인 담당이 정하고, [01-design-system.md](01-design-system.md)를 고친다.
- 새 컴포넌트는 Figma에서 먼저 만들고, `app/components/ui/`에 같은 이름으로 만든다.
- 디자인을 코드에 반영할 때 색 코드를 직접 쓰지 않고 토큰을 쓴다.

## 디자인 담당이 Figma MCP로 맡는 일

Claude + Figma MCP로 할 수 있는 일은 디자인 트랙이 맡는다 ([../prd/decisions.md](../prd/decisions.md) D-22).

| 일 | 요구사항 | Claude Code에 이렇게 요청 |
| --- | --- | --- |
| 화면 설계·구현 | DIF-1~9, LAW-3·7~10·12, OPS-1 | "C-19 프레임대로 화면을 만들어줘" (아래 "화면 구현") |
| 디자인 시스템 | — | "`globals.css` 토큰으로 Figma 변수와 컴포넌트를 만들어줘", Code Connect 연결 |
| 페르소나 평가 렌더링 | DIF-1 | "C-12 프레임을 렌더링해서 `/ux-persona-review C-12` 실행해줘" |
| 사용성 테스트 프로토타입 | OPS-9 | "C-03 → C-12 → C-14 흐름을 Figma 프로토타입으로 연결해줘" |
| 발표 자료 | OPS-10 | "이 스토리로 Figma Slides 발표 자료를 만들어줘" |
| 흐름도·구조도 | OPS-8, OPS-10 | "02-screens.md의 화면 흐름을 FigJam 다이어그램으로 그려줘" |
| 시연 QR 안내물 | OPS-6 | "체험 주소 QR과 사용 안내가 들어간 카드를 Figma에 만들어줘" |

## 화면 구현 (디자인 담당)

디자인 담당이 화면 컴포넌트를 만들고, 개발 1이 데이터를 연결한다.

1. Figma에서 흐름과 레이아웃을 잡는다. 직접 구현할 화면은 상태별 프레임을 모두 그리지 않아도 된다.
2. "C-19 프레임대로 화면을 만들어줘. 데이터는 props로 받고, `docs/spec/03-api.md` 응답 모양의 임시 데이터로 채워줘"처럼 요청해 구현한다.
3. 빈 상태, 불러오는 중, 오류, 긴 내용을 코드에서 확인한다. 접근성 기준(본문 18px, 터치 48px, 대비 4.5:1)도 점검한다.
4. 요구사항 ID를 넣은 브랜치(`feature/DIF-2-guardian-report-ui`)로 PR을 올리고, 개발 1이 리뷰한다.
5. 개발 1이 API를 만든 뒤 임시 데이터를 실제 데이터로 바꾼다. 데이터 불러오기 코드는 개발 1이 고친다.
