# 01. 디자인 시스템

손다음의 화면은 **귤색 하나를 주색으로 쓰고, 큰 글씨와 큰 버튼**으로 60대 요양보호사가 쓰기 쉽게 만든다. 이 문서의 값은 코드(`app/globals.css`, `app/components/ui/`)에 실제로 들어 있는 값이다. Figma와 다르면 이 문서와 코드를 기준으로 맞춘다.

## 브랜드

- 이름: 손다음. 손이 닿음을 뜻하는 '손닿음'에서 따왔다. 돌보는 손과 돌봄받는 손, 그 다음을 준비한다는 뜻.
- 주색: 귤색. 친근함, 따뜻함, 밝음.
- 로고: `public/brand/logo-mark.svg`(심볼), `public/brand/logo-full.svg`(심볼 + 글자)

## 색

| 토큰 | 값 | 쓰는 곳 |
| --- | --- | --- |
| `accent` | `#ffb133` | 주 버튼, 강조, 앱 테마색 |
| `accent-dark` | `#e69a1f` | 주 버튼 눌림 |
| `accent-soft` | `#fff4e3` | 안내 상자, 아바타 배경 |
| `accent-soft-foreground` | `#8a5c12` | `accent-soft` 위 글자 |
| `accent-foreground` | `#212427` | `accent` 위 글자 |
| `record` | `#ff5533` | 녹음 버튼, 위험 버튼 |
| `chip-schedule` | `#9cdbd1` | 방문 일정 칩 |
| `foreground` | `#222222` | 본문 글자 |
| `muted` | `#727272` | 보조 글자 |
| `border` | `#c4c4c4` | 입력칸·보조 버튼 테두리 |
| `background` / `card` | `#ffffff` | 화면·카드 배경 |

## 글꼴과 크기

- 글꼴: Pretendard Variable (`node_modules/pretendard`), 대체 글꼴 Apple SD Gothic Neo
- 화면 제목: `text-xl` (20px) semibold
- 입력칸 이름·버튼: `text-lg` (18px) semibold
- 칩·상태 배지: `text-sm` (14px)

## 모양

| 토큰 | 값 |
| --- | --- |
| `radius-card` | 15px (카드, 버튼, 칩 공통) |
| `shadow-card` | `0 4px 15px rgba(0,0,0,0.12)` |
| 주 버튼 높이 | 64px (`h-16`), 가로 꽉 채움 |
| 화면 상단 바 높이 | 56px (`h-14`) |

## 컴포넌트 (`app/components/ui/`)

| 컴포넌트 | 종류 | 설명 |
| --- | --- | --- |
| `Button`, `LinkButton` | `primary` · `secondary` · `danger` | 높이 64px, 18px 글자 |
| `Card` | 기본 · 안내(soft) | 흰 카드 / 귤색 옅은 안내 상자 |
| `Chip` | 일정 등 | 요일·시간, 인정번호 표시 |
| `StatusBadge` | 방문 상태 6종 | 시작 전 · 녹음중 · 녹음 완료 · AI 정리중 · 검토 대기 · 전송 완료 |
| `Field`, `ScheduleField` | 입력 | 이름표 18px, 요일 선택 + 시간 선택 |
| `PageHeader` | 상단 바 | 뒤로 가기 + 제목 |
| `Avatar` | 수급자 | 성(첫 글자)을 귤색 원 안에 표시 |
| `Logo` | 브랜드 | 높이 32px |

## 고령 사용자 접근성 기준

DIF-1 페르소나 평가([03-ux-persona-review.md](03-ux-persona-review.md))의 채점 기준으로도 쓴다.

| 항목 | 기준 | 현재 |
| --- | --- | --- |
| 본문 글자 | 18px 이상 | 대체로 충족, 칩·배지 14px은 보조 정보에만 |
| 터치 영역 | 48×48px 이상, 주 동작은 64px 높이 | 주 버튼 충족, 아이콘 버튼 확인 필요 |
| 글자 대비 | 4.5:1 이상 | `accent` 위 흰 글자는 미달이라 어두운 글자(`#212427`) 사용 중 |
| 한 화면의 주 동작 | 1개 | 화면별 점검 필요 |
| 용어 | 현장 용어 그대로 (수급자, 급여제공기록지), 영어·개발 용어 없음 | "PWA", "링크" 등 점검 필요 |
| 오류 회복 | 모든 단계에서 뒤로 가기, 입력 내용 유지 | STB-3 전까지 미충족 |

## 바꿀 때

새 색이나 크기가 필요하면 `app/globals.css`의 `:root`에 토큰을 추가하고 이 표에 한 줄 더한다. 컴포넌트 안에 색 코드를 직접 쓰지 않는다.
