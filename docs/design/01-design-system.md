# 01. 디자인 시스템

손다음의 화면은 **귤색 하나를 주색으로 쓰고, 큰 글씨와 큰 버튼**으로 60대 요양보호사가 쓰기 쉽게 만든다. 기준은 Figma "design system" 페이지의 [손다음 사본](https://www.figma.com/design/OFZIKhGWAAxCUoL9dNtgJb/?node-id=383-732)과 로컬 변수 "손다음"·텍스트 스타일이고, 2026-10-18 값이다. 화면 코드는 1120 고도화 버전(`app/v1120/`, D-30)을 기준으로 적는다. 옛 화면(`app/components/` 등)은 1120이 자리 잡으면 지우므로 다루지 않는다. 디자인 작업을 하며 값이 바뀌면 Figma를 먼저 고치고 이 문서와 코드를 맞춘다.

| 위치 | 내용 |
| --- | --- |
| Figma 로컬 변수 "손다음" (유일한 컬렉션, 페인트 스타일은 쓰지 않음) | 색 18·간격·모서리·글자 크기·줄 간격 |
| Figma 텍스트 스타일 `Type/…` | 글자 6종 (Pretendard Variable) |
| `app/globals.css` | 공통 토큰 (`:root` 변수 → Tailwind v4 `@theme inline`) |
| `app/v1120/tokens.css` | 1120 화면 토큰. `.v1120` 안에서 공통 토큰을 덮어쓴다 |
| `app/v1120/_components/ui.tsx` | 1120 공용 컴포넌트 |
| `app/layout.tsx` | 글꼴(Pretendard Variable), 테마색 `#ffb133` |
| `public/brand/` | 로고, 아이콘, 이미지 |

## 브랜드

- 이름: 손다음. 손이 닿음을 뜻하는 '손닿음'에서 따왔다. 돌보는 손과 돌봄받는 손, 그 다음을 준비한다는 뜻.
- 주색: 귤색 `#ffb133` (`brand/primary`). 친근함, 따뜻함, 밝음. 브라우저·PWA 테마색(`viewport.themeColor`)도 같은 값이다.
- 로고: `public/brand/logo-mark.svg`(심볼), `public/brand/logo-full.svg`(심볼 + 글자). 앱 아이콘(`app/icon.tsx`, `apple-icon.tsx`)도 이 심볼로 만든다.

## 색

색은 Figma 변수 컬렉션 **"손다음"**(파일 `OFZIKhGWAAxCUoL9dNtgJb`, design system 페이지 [손다음 사본](https://www.figma.com/design/OFZIKhGWAAxCUoL9dNtgJb/?node-id=383-732))이 기준이다. 2026-10-18 디자인이 고친 값이고, 디자인 작업을 하며 다시 바뀔 수 있다. 1120 코드에는 같은 값이 `app/globals.css`(공통)와 `app/v1120/tokens.css`(1120 화면에서 덮어씀)에 들어 있다 (10/18 반영).

브랜드 색은 귤색 두 개(`brand/primary`·`brand/secondary`)만 두고, 귤색을 바탕·글자로 쓰는 변형은 `background`·`text` 그룹에 둔다.

### 변수

| Figma 변수 | 값 | 쓰는 곳 | 코드 토큰 |
| --- | --- | --- | --- |
| `brand/primary` | `#ffb133` | 주 버튼·체크 표시 바탕, 하단 메뉴 선택 알약, 입력칸 포커스·빈 칸 링, 강조. 브라우저 테마색 | `accent` |
| `brand/secondary` | `#e69a1f` | 주 버튼 눌림 | `accent-dark` |
| `text/primary` | `#222222` | 본문 글자, 주 버튼(`brand/primary`) 위 글자 | `foreground` · `accent-foreground` |
| `text/secondary` | `#5c5c5c` | 보조 글자, 입력칸 안내 글자 | `--muted` |
| `text/brand` | `#8a5c12` | `background/brand` 위 글자, 선택한 라디오 테두리 | `accent-soft-foreground` |
| `text/success` | `#0559d2` | `status/success-soft` 위 글자 (기록 확인 토글 등) | `--text-success` |
| `text/danger` | `#ba0c09` | `status/danger-soft` 위 글자 | `--text-danger` |
| `background/primary` | `#ffffff` | 화면·카드 바탕 | `background` · `card` |
| `background/secondary` | `#f4f4f4` | 회색 바탕 (보조 버튼, 시작 전 배지) | `--neutral-soft` |
| `background/brand` | `#fff4e3` | 귤색 안내 상자, 선택된 카드, 아바타 | `accent-soft` |
| `border/default` | `#8c8c8c` | 입력칸·보조 버튼 테두리 | `--border` |
| `border/line` | `#e3e3e3` | 구분선, 연한 테두리 | `--line` |
| `status/record` | `#ff5533` | 녹음 버튼·녹음 중 표시에만 | `record` |
| `status/danger` | `#e20000` | 삭제·오류 문구, 위험 버튼 | `--danger` |
| `status/danger-soft` | `#ffe8e8` | 오류 안내 바탕 | `--danger-soft` |
| `status/success` | `#016bff` | 완료·확인함 표시 | `--success` |
| `status/success-soft` | `#e4efff` | 완료 안내 바탕, 확인한 섹션 | `--success-soft` |
| `status/schedule` | `#9cdbd1` | 방문 일정 칩 | `chip-schedule` |
| `status/memo` | `#fff6c7` | 메모 상자 | `--memo` |

- 주 버튼 위 글자는 따로 두지 않고 `text/primary`를 쓴다 (전 `accent-foreground` `#212427`은 `#222222`와 거의 같아 뺌).
- `status/danger`·`danger-soft`는 `status/success`·`success-soft`와 명도·채도를 같게 맞춘 빨강이다 (OKLCH L 0.573·C 0.235, 연한 쪽 L 0.949·C 0.025). 둘을 나란히 놓아도 한쪽만 튀지 않는다.
- 연한 바탕(`*-soft`) 위 글자는 `text/brand`처럼 같은 색의 진한 글자를 쓴다: `text/success`·`text/danger`(둘 다 OKLCH L 0.50·C 0.20). `status/danger`·`success`는 흰 바탕 글자와 버튼·테두리·아이콘에 쓴다.
- 귤색(`brand/primary`)은 흰 바탕과 1.8:1이라 얇은 선 하나로 상태를 알리지 않는다 (10/20). 상태는 면적으로 보인다: 입력칸 포커스는 귤색 테두리 + 3px 귤색 번짐 링(50%), 확인 필요 빈 칸은 같은 링(30%), 하단 메뉴 선택은 아이콘 뒤를 귤색 알약으로 채움(아이콘 `text/primary` 8.8:1). 귤색 바탕 위 글자는 `text/primary`.
- 카카오 로그인 버튼(`#FEE500` / `#191919`)은 카카오 브랜드 규정 색이라 변수로 두지 않는다.

### 글자 대비

WCAG 기준(본문 4.5:1, 18px 굵은 글자 3:1)으로 계산한 값이다.

| 조합 | 대비 | 판정 |
| --- | --- | --- |
| `text/primary` / `background/primary` | 15.9:1 | 충족 |
| `text/primary` / `brand/primary` (주 버튼) | 8.8:1 | 충족 |
| `text/primary` / `brand/secondary` (주 버튼 눌림) | 6.8:1 | 충족 |
| `text/secondary` / `background/primary` | 6.7:1 | 충족 |
| `text/secondary` / `background/secondary` | 6.1:1 | 충족 |
| `text/brand` / `background/brand` | 5.3:1 | 충족 |
| `status/danger` / 흰 바탕 (오류 문구), 흰 글자 / `status/danger` (위험 버튼) | 5.0:1 | 충족 |
| `status/success` / 흰 바탕, 흰 글자 / `status/success` | 4.6:1 | 충족 |
| `text/danger` / `status/danger-soft` | 5.7:1 | 충족 |
| `text/success` / `status/success-soft` (기록 확인 토글) | 5.4:1 | 충족 |
| `status/danger` · `status/success` / 각자 `-soft` 바탕 | 4.2:1 · 4.0:1 | 미달이라 글자에는 쓰지 않는다 (위 `text/danger`·`text/success`) |
| `border/default` / 흰 바탕 (테두리) | 3.4:1 | 테두리 기준 3:1 충족, 글자로는 쓰지 않음 |
| 흰 글자 / `status/record` | 3.2:1 | 미달이라 녹음 버튼 글자는 버튼 밖에 둔다 |
| `brand/primary` / 흰 바탕 (선) | 1.8:1 | 미달이라 얇은 선만으로 상태를 알리지 않는다. 링·알약처럼 면적으로 쓴다 |
| `text/primary` / `brand/primary` (선택 알약 위 아이콘) | 8.8:1 | 충족 |

## 글자

글꼴은 Pretendard Variable(`next/font/local`, 대체 Apple SD Gothic Neo). 1120 화면의 기본 글자는 18px, 줄 간격 1.6이다 (`.v1120`). **가장 작은 글자는 16px**이다 (10/18 결정). 시각·날짜 같은 덧붙임 정보도 16px 아래로 쓰지 않는다.

| Figma 텍스트 스타일 | 크기 / 줄 간격 | 코드 | 쓰는 곳 | 1120 사용 |
| --- | --- | --- | --- | --- |
| `Type/Bold/24px` | 24 / 32 | `text-2xl font-bold` | 홈 인사, 화면 큰 제목, 아바타 글자 | 23회 |
| `Type/Bold/20px` | 20 / 28 | `text-xl font-bold` | 화면 제목 | 18회 |
| `Type/Bold/18px` · `Type/Regular/18px` | 18 / 28 | `text-lg` | 본문, 버튼, 입력칸·이름표, 카드 제목 | 122회 |
| `Type/Bold/16px` · `Type/Regular/16px` | 16 / 24 | `text-base` | 보조 설명, 상태 배지, 칩, 오류 문구, 시각·날짜 (최소 크기) | 137회 |

- 굵기는 Bold와 Regular 두 가지만 쓴다 (SemiBold 없음).
- 30px(`type/size/30`, 줄 간격 36)은 변수만 있고 텍스트 스타일은 없다. 코드에는 `text-3xl` 1곳.
- 14px(`text-sm`, Figma `Type/Regular/14px`·`type/size/14`)은 10/18에 없앴다. `text-sm`·`text-xs`를 쓰지 않는다.

## 간격

Figma 변수 `spacing/*`: 2 · 4 · 6 · 8 · 12 · 16 · 20 · 24 · 32 (px). 코드는 Tailwind 4px 단계(`gap-2` = 8px)를 그대로 쓴다.

| 항목 | 값 | 코드 |
| --- | --- | --- |
| 화면 폭 | 최대 448px, 가운데 | `Screen`: `mx-auto max-w-md` |
| 화면 여백 | 24px | `p-6` |
| 블록 사이 | 24px | `gap-6` |
| 카드 안 여백 · 사이 | 20px · 16px | `Card`: `p-5 gap-4` |
| 안내 상자 안 여백 | 16px × 12px | `Callout`: `px-4 py-3` |
| 붙은 버튼 사이 | 12px 이상 | `gap-3` |
| 하단 고정 버튼 | 화면 아래, 위로 흰색 그라데이션. 본문 아래 여백 160px (메뉴바와 같이 있으면 224px) | `Screen` `bottom` |
| 하단 메뉴바 | 높이 64px, 홈·수급자·대화·내 정보 (보호자는 홈·대화·내 정보) | `BottomNav` |

## 모양

| Figma 변수 | 값 | 코드 | 쓰는 곳 | 1120 사용 |
| --- | --- | --- | --- | --- |
| `radius/15` | 15px | `rounded-[15px]` (토큰 `radius-card`) | 큰 버튼, 카드, 입력칸 | 43회 |
| `radius/12` | 12px | `rounded-xl` | 작은 버튼(뒤로 등), 안내 상자, 목록 칸 | 42회 |
| `radius/9999` | 원 | `rounded-full` | 상태 배지, 칩, 아바타 | 19회 |
| `radius/16` | 16px | `rounded-2xl` | 바텀시트 | 2회 |
| `radius/6` | 6px | `rounded-md` | 작은 표시 | 4회 |

- 그림자: 카드 `shadow-card` `0 4px 15px rgba(0,0,0,0.12)` = Figma 효과 스타일 `gradation`.
- `rounded-[15px]` 대신 토큰 클래스(`rounded-card`)로 바꾸는 건 남은 정리다.

## 컴포넌트 (`app/v1120/_components/ui.tsx`)

공통 기준: 본문 18px, 터치 영역 48px 이상, 아이콘만 있는 버튼 없음, 비활성 버튼에는 이유 한 줄.

| 컴포넌트 | 종류·속성 | 크기와 모양 | 색 |
| --- | --- | --- | --- |
| `Button`, `LinkButton` | `primary` · `secondary` · `danger`, `disabledReason` | 높이 64px, 가로 꽉 채움, 18px bold, 모서리 15px | primary: `brand/primary` 바탕 + `text/primary` 글자, 눌림 `brand/secondary`. secondary: 흰 바탕 + `border/default` 테두리, 눌림 `background/brand`. danger: `status/danger` 바탕 + 흰 글자. 비활성: `background/secondary` 바탕 + `text/secondary` 글자, 위에 이유 한 줄 |
| `SmallLinkButton`, `BackButton` | — | 높이 48px 이상, 16px bold, 모서리 12px, 테두리 | "← 뒤로"처럼 글자와 함께 |
| `Screen` | `bottom`(하단 고정 버튼), `nav`(하단 메뉴바) | 위 "간격" | — |
| `TopBar` | `backHref`, `title` | 뒤로 버튼 + 20px bold 제목 | — |
| `Card` | — | 여백 20px, 모서리 15px, `shadow-card` | 흰 바탕 |
| `Callout` | `title` | 여백 16×12px, 모서리 12px, 16px | `background/brand` 바탕 + `text/brand` 글자 |
| `StatusBadge` | 방문 상태 6종 (아래 표) | 원, 16px bold | — |
| `Chip` | `schedule` · `done` · `outline` | 원, 16px | schedule: `status/schedule`. done: `status/success-soft` + `text/success`. outline: 흰 바탕 + 테두리 |
| `Avatar` | `name` | 56px 원, 첫 글자 24px bold | `background/brand` + `text/brand` |
| `Field` | `label`, `hint` + input 속성 | 입력칸 높이 56px, 18px, 이름표 18px bold, 모서리 15px | 테두리 `border/default`, 누르면 `brand/primary`. 안내 글자 `text/secondary` |
| `SectionTitle` | — | 18px bold | — |

### 방문 상태 배지 (`StatusBadge`)

| 상태 | 글자 | 바탕 / 글자 |
| --- | --- | --- |
| `NOT_STARTED` | 시작 전 | `background/secondary` / `text/secondary` |
| `RECORDING` | 기록 중 | `background/brand` / `text/brand` |
| `RECORDED` | 녹음 완료 | `background/brand` / `text/brand` |
| `SUMMARIZING` | AI 정리 중 | `background/brand` / `text/brand` |
| `DRAFT_READY` | 확인 필요 | `background/brand` / `text/brand` |
| `SENT` | 보냄 완료 | `status/success-soft` / `text/success` |

진행 중인 네 상태는 같은 귤색이고 글자로 구분한다.

### 공용 컴포넌트가 아닌 화면 부품

| 부품 | 파일 | 메모 |
| --- | --- | --- |
| 하단 메뉴바 | `BottomNav.tsx` | 기호 + 글자(⌂ 홈 · ☺ 수급자 · ✉ 대화 · ☰ 내 정보), 선택은 `text/primary`와 `brand/secondary` 아이콘, 안 읽은 수는 `status/danger` 원 |
| 일정 바텀시트 | `ScheduleSheet.tsx` | 날짜마다 방문 건수 숫자 (DIF-1 1차) |
| 대화방 | `ChatRoom.tsx` | 내 말 오른쪽, 보고서는 카드 |
| 보호자 보고서·서류 | `ReportView.tsx`, `DocumentViews.tsx`, `CareSheet.tsx` | 변화상태: 좋아졌어요 `status/success-soft`+`text/success`, 나빠졌어요 `status/danger-soft`+`text/danger` |
| 인쇄·PDF 버튼 | `PrintActions.tsx` | — |

## 아이콘

아이콘 라이브러리는 쓰지 않는다. 글자와 함께 쓰는 기호(✓ ▲ ▼ ← ⌂ ✉)와 `public/brand/` 이미지만 쓴다. 기호만 있는 버튼은 만들지 않는다.

## 고령 사용자 접근성 기준

DIF-1 페르소나 평가([03-ux-persona-review.md](03-ux-persona-review.md))의 채점 기준으로도 쓴다. 기준 화면은 Figma [접근성 버전 와이어](https://www.figma.com/design/OFZIKhGWAAxCUoL9dNtgJb/?node-id=359-942).

| 항목 | 기준 | 1120 현재 |
| --- | --- | --- |
| 본문 글자 | 18px 이상, 가장 작은 글자 16px | 기본 18px, 보조 설명·배지·시각은 16px. 16px보다 작은 글자 없음 |
| 터치 영역 | 48×48px 이상, 주 동작은 64px 높이 | 주 버튼 64px, 입력칸 56px, 작은 버튼·뒤로 48px |
| 글자 대비 | 4.5:1 이상 | 충족 (위 "글자 대비"). 연한 바탕 위는 `text/brand`·`text/success`·`text/danger` |
| 한 화면의 주 동작 | 1개 | 하단 고정 주 버튼 하나 |
| 용어 | 현장 용어 그대로 (수급자, 급여제공기록지), 영어·개발 용어 없음 | 요양보호사 화면은 "수급자", 보호자 화면은 "어르신" (D-31) |
| 오류 회복 | 모든 단계에서 뒤로 가기, 입력 내용 유지 | 녹음 문장마다 저장 (STB-3, D-27) |
| 색 외 구분 | 상태를 색만으로 구분하지 않음 | 상태 배지·변화상태 모두 글자 + 기호 |

## 남은 정리

1. `rounded-[15px]`를 토큰 클래스로, `.v1120`의 `--muted`·`--border` 등 덮어쓰기를 1120 머지 때 `globals.css`로 옮기기.
2. Figma 변수 이름(`brand/primary`, `text/brand` …)과 코드 토큰 이름(`accent`, `accent-soft-foreground` …)을 맞출지 정하기. 지금은 위 "색" 표가 대응표다.

## 바꿀 때

- 색·크기는 Figma 변수를 먼저 고치고, 이 문서의 표와 `app/v1120/tokens.css`(1120 머지 뒤에는 `globals.css`)를 같이 고친다. 컴포넌트 안에 색 코드를 직접 쓰지 않는다.
- 토큰 값을 바꾸면 개발 1에게 PR 리뷰를 받는다 ([../prd/05-roadmap.md](../prd/05-roadmap.md) "파일 나누기").
- 새 컴포넌트는 Figma에서 먼저 만들고 `ui.tsx`에 같은 이름으로 만든다 ([04-figma-workflow.md](04-figma-workflow.md)).
