# 01. 디자인 시스템

손다음의 화면은 **귤색 하나를 주색으로 쓰고, 큰 글씨와 큰 버튼**으로 60대 요양보호사가 쓰기 쉽게 만든다. 이 문서의 값은 2026-10-06 기준 코드(`app/globals.css`, `app/components/ui/`, 화면 파일)에 실제로 들어 있는 값이고, 사용 횟수는 `app/**/*.tsx`에서 센 것이다. Figma와 다르면 이 문서와 코드를 기준으로 맞춘다.

| 위치 | 내용 |
| --- | --- |
| `app/globals.css` | 색·모양 토큰 (`:root` 변수 → Tailwind v4 `@theme inline`) |
| `app/layout.tsx` | 글꼴(Pretendard Variable), 테마색 `#ffb133` |
| `app/components/ui/` | 공용 컴포넌트 9종 |
| `public/brand/` | 로고, 아이콘, 홈 배경 이미지 |

## 브랜드

- 이름: 손다음. 손이 닿음을 뜻하는 '손닿음'에서 따왔다. 돌보는 손과 돌봄받는 손, 그 다음을 준비한다는 뜻.
- 주색: 귤색 `#ffb133`. 친근함, 따뜻함, 밝음. 브라우저·PWA 테마색(`viewport.themeColor`)도 같은 값이다.
- 로고: `public/brand/logo-mark.svg`(심볼), `public/brand/logo-full.svg`(심볼 + 글자). 심볼은 `app/components/brandAssets.ts`에 data URL로도 있어 앱 아이콘(`app/icon.tsx`, `apple-icon.tsx`, `pwa-icon-512`)을 만들 때 쓴다.
- 이미지: `hero-background.png`(홈 상단 배경), `hero-illustration.svg`, `calendar-icon.svg`, `back-arrow.png`

## 색

### 토큰

Tailwind 클래스는 토큰 이름 그대로 쓴다 (`bg-accent`, `text-muted`, `border-border`).

| 토큰 | 값 | 쓰는 곳 | 사용 |
| --- | --- | --- | --- |
| `accent` | `#ffb133` | 주 버튼, 선택된 요일, 전송 완료 배지, 강조 | 14회 |
| `accent-dark` | `#e69a1f` | 주 버튼 눌림 | 10회 |
| `accent-soft` | `#fff4e3` | 안내 상자(`Callout`), 아바타 배경, 보조 버튼 눌림 | 7회 |
| `accent-soft-foreground` | `#8a5c12` | `accent-soft` 위 글자 | 7회 |
| `accent-foreground` | `#212427` | `accent` 위 글자 (흰 글자는 대비 미달) | 11회 |
| `record` | `#ff5533` | 녹음 버튼, 녹음중 표시, 위험 버튼, 오류 문구 | 20회 |
| `chip-schedule` | `#9cdbd1` | 방문 일정 칩 | 1회 |
| `foreground` | `#222222` | 본문 글자 | 14회 |
| `muted` | `#727272` | 보조 글자 (가장 많이 쓰는 글자색) | 48회 |
| `border` | `#c4c4c4` | 입력칸·보조 버튼 테두리, 입력칸 안내 글자 | 20회 |
| `background` / `card` | `#ffffff` | 화면·카드 배경 | 20회 |

### 토큰 밖에서 쓰는 색

아래는 토큰 없이 Tailwind 기본 색이나 색 코드를 직접 쓰는 곳이다. 같은 용도가 반복되므로 토큰으로 옮길 후보다.

| 색 | 쓰는 곳 | 정리 방향 |
| --- | --- | --- |
| `gray-100` / `gray-200` | 회색 보조 버튼(`ClientCard`, `ClientManageRow`), 시작 전 배지, `Chip` muted | `neutral-soft` 토큰 |
| `amber-50` · `amber-200` · `amber-600` · `amber-700` · `amber-800` | 검토 대기 배지, 녹음 화면 경고 카드, 보고서 입력 경고 문구 | `warning`, `warning-soft` 토큰 |
| `red-50` / `red-700` | 녹음중 배지 배경, 위험 버튼 눌림 | `record-soft`, `record-dark` 토큰 |
| `black/40` | 모달 뒤 어두운 막 (5곳) | `overlay` 토큰 |
| `#FEE500` / `#191919` | 카카오 로그인 버튼 (`app/login/page.tsx`) | 카카오 브랜드 규정 색이라 그대로 두되 토큰 이름만 붙임 (`kakao`) |
| `bg-white` / `text-white` | 보조 버튼·칩 배경, 위험 버튼 글자 | `card` 토큰으로 통일 |

### 글자 대비

WCAG 기준(본문 4.5:1)으로 계산한 값이다.

| 조합 | 대비 | 판정 |
| --- | --- | --- |
| `foreground` / 흰 배경 | 15.9:1 | 충족 |
| `accent-foreground` / `accent` (주 버튼) | 8.6:1 | 충족 |
| `gray-600` / `gray-100` (시작 전 배지) | 6.9:1 | 충족 |
| `accent-soft-foreground` / `accent-soft` | 5.3:1 | 충족 |
| `amber-700` / `amber-50` (검토 대기 배지) | 4.8:1 | 충족 |
| `muted` / 흰 배경 | 4.8:1 | 충족 (여유 적음) |
| `muted` / `gray-100` (회색 보조 버튼) | 4.4:1 | **미달** |
| 흰 글자 / `record` (위험 버튼) | 3.2:1 | **미달** (18px 굵은 글자 기준 3:1은 충족) |
| `record` / 흰 배경 (오류 문구) | 3.2:1 | **미달** |
| `amber-600` / 흰 배경 (경고 문구) | 3.2:1 | **미달** |
| `record` / `red-50` (녹음중 배지) | 2.9:1 | **미달** |
| `border` / 흰 배경 (입력칸 안내 글자) | 1.7:1 | **미달** |
| 흰 글자 / `accent` (쓰지 않음) | 1.8:1 | 미달이라 `accent-foreground`를 씀 |

## 글꼴과 크기

- 글꼴: Pretendard Variable (`node_modules/pretendard`, `next/font/local`로 `--font-pretendard`에 연결), 대체 글꼴 Apple SD Gothic Neo
- 크기는 Tailwind 기본 단계를 쓰고, 임의 크기(`text-[..px]`)는 쓰지 않는다.

| 클래스 | 크기 | 쓰는 곳 | 사용 |
| --- | --- | --- | --- |
| `text-2xl` | 24px | 홈 인사말, 아바타 글자, 보고서 섹션 아이콘 | 8회 |
| `text-xl` | 20px | 화면 제목(`PageHeader`) | 10회 |
| `text-lg` | 18px | 버튼, 입력칸과 이름표, 카드 제목, 보고서 본문 | 30회 |
| `text-base` | 16px | 보조 설명, 빈 목록 안내, 오류·경고 문구, 보호자 보고서 인사 | 52회 |
| `text-sm` | 14px | 칩, 상태 배지, 모달 안 보조 정보, 링크 복사 버튼 | 25회 |

- 굵기: `font-semibold`(43회)가 기본, 이름·섹션 제목은 `font-bold`(17회), 입력칸 값은 `font-normal`
- 가장 많이 쓰는 크기가 16px이라 "본문 18px 이상" 기준과 어긋난다 (아래 "기준과 다른 곳").

## 레이아웃과 간격

모든 화면은 휴대폰 한 손 사용을 전제로 한 한 줄 세로 배치다.

| 항목 | 값 | 코드 |
| --- | --- | --- |
| 화면 폭 | 최대 448px, 가운데 정렬 | `mx-auto w-full max-w-md` (21곳) |
| 화면 여백 | 24px | `p-6` |
| 블록 사이 간격 | 24px (보호자 보고서는 20px) | `gap-6` / `gap-5` |
| 상단 바 | 높이 56px, 제목 가운데, 뒤로 가기 왼쪽 | `PageHeader` |
| 하단 고정 버튼 | 화면 아래에 붙은 주 버튼, 본문은 아래 여백 112px | `fixed bottom-0 … p-6 pt-3`, 본문 `pb-28` (홈, 기록) |
| 모달 | 휴대폰에서는 아래에서 올라오는 시트, 넓은 화면에서는 가운데 | `fixed inset-0 bg-black/40 items-end sm:items-center`, 안쪽 `max-w-md rounded-2xl p-6` |

## 모양

| 토큰 / 값 | 쓰는 곳 | 사용 |
| --- | --- | --- |
| 모서리 15px (`rounded-[15px]`, 토큰 `radius-card`) | 카드, 버튼, 입력칸, 칩 | 27회 |
| 완전한 원 (`rounded-full`) | 아바타, 상태 배지, 요일 버튼 | 9회 |
| 16px (`rounded-2xl`) | 모달, 보고서 섹션 | 3회 |
| 12px (`rounded-xl`) | 수급자 등록·수정의 일부 입력칸, 보고서 입력칸 | 3회 |
| 20px | 로그인 카드 | 1회 |
| 8px | 녹음 정지 버튼 안 네모 | 1회 |
| 그림자 `shadow-card` `0 4px 15px rgba(0,0,0,0.12)` | 카드, 버튼 | — |
| 그림자 `shadow-lg` (Tailwind 기본) | 모달 | — |

`radius-card` 토큰은 정의돼 있지만 코드에서는 `rounded-[15px]`로 값을 직접 쓴다.

## 컴포넌트 (`app/components/ui/`)

| 컴포넌트 | 종류·속성 | 크기와 모양 | 메모 |
| --- | --- | --- | --- |
| `Button`, `LinkButton` | `primary` · `secondary` · `danger` | 높이 64px, 가로 꽉 채움, 18px semibold, 모서리 15px, `shadow-card` | 비활성 시 투명도 40%. 눌림: primary `accent-dark`, secondary `accent-soft`, danger `red-700` |
| `Card` | — | 흰 배경, 안쪽 여백 24px, 모서리 15px, `shadow-card` | 녹음 화면 경고처럼 `className`으로 amber 색을 덮어쓰는 곳이 있음 |
| `Callout` | — | `accent-soft` 배경, `accent` 30% 테두리, 여백 20px | 귤색 안내 상자 |
| `Chip` | `outline` · `schedule` · `muted` | 14px medium, 좌우 12px, 모서리 15px | 요일·시간, 인정번호 |
| `StatusBadge` | 방문 상태 6종 (아래 표) | 14px semibold, 완전한 원 | 녹음중은 점이 깜박임 |
| `Field`, `SelectField` | `label` + 기본 input/select 속성 | 입력칸 높이 56px, 18px, 이름표 18px semibold | 안내 글자는 `border` 색 |
| `ScheduleField` | `name`, `defaultValue` (예: `월,수 09:00-12:00`) | 요일 버튼 44×44px 원, 시·분 선택 높이 56px | 분은 15분 단위. 선택된 요일은 `accent` |
| `PageHeader` | `title`, `backHref` 또는 `onBack`, `right` | 높이 56px, 제목 20px semibold, 뒤로 가기 38×38px | 뒤로 가기 아이콘은 `back-arrow.png` 22px |
| `Avatar` | `name` | 원, `accent-soft` 배경에 첫 글자 24px bold | 크기는 쓰는 곳에서 지정 |
| `Logo` | — | 높이 32px | `logo-full.svg` |

### 방문 상태 배지 (`StatusBadge`)

| 상태 | 글자 | 배경 / 글자색 |
| --- | --- | --- |
| `NOT_STARTED` | 시작 전 | `gray-100` / `gray-600` |
| `RECORDING` | 녹음중 | `red-50` / `record` + 깜박이는 점 |
| `RECORDED` | 녹음 완료 | `accent-soft` / `accent-soft-foreground` |
| `SUMMARIZING` | AI 정리중 | `accent-soft` / `accent-soft-foreground` |
| `DRAFT_READY` | 검토 대기 | `amber-50` / `amber-700` |
| `SENT` | 전송 완료 | `accent` / `accent-foreground` |

녹음 완료와 AI 정리중은 같은 색이라 색만으로는 구분되지 않는다.

### 공용 컴포넌트가 없는 반복 패턴

| 패턴 | 지금 있는 곳 | 모양 |
| --- | --- | --- |
| 회색 보조 버튼 | `ClientCard`, `ClientManageRow` | 높이 56px, `gray-100` 배경, `muted` 글자, 눌림 `gray-200` |
| 모달 (바텀시트) | `ClientProfileModal`, `CaregiverProfileModal`, `ScheduleCalendarModal`, `ReviewForm` 확인창 2개 | 위 "레이아웃과 간격"의 모달 |
| 보고서 섹션 | `ReportSection` (검토·보호자 보고서) | 이모지 아이콘 + 18px bold 제목, 모서리 16px 테두리 상자, 입력칸 최소 높이 80px |
| 카카오 로그인 버튼 | `app/login/page.tsx` | 높이 64px, `#FEE500` 배경, `#191919` 글자 |
| 하단 고정 주 버튼 | 홈, 기록 화면 | 위 "레이아웃과 간격"의 하단 고정 버튼 |

## 아이콘

아이콘 라이브러리는 쓰지 않는다. 이미지 파일 2개와 이모지를 쓴다.

- 이미지: `back-arrow.png`(뒤로 가기), `calendar-icon.svg`(홈 일정 버튼, 24px)
- 이모지: 보고서 섹션과 안내 문구에 🍚 식사 · 💊 복약 · 📝 특이사항 · ⚠ 경고 · ✅ 완료 · 🔗 링크 · 💬 메시지
- 이모지는 기기마다 모양이 달라서, Figma에서 아이콘 세트를 정하면 바꿀 후보다.

## 고령 사용자 접근성 기준

DIF-1 페르소나 평가([03-ux-persona-review.md](03-ux-persona-review.md))의 채점 기준으로도 쓴다.

| 항목 | 기준 | 현재 |
| --- | --- | --- |
| 본문 글자 | 18px 이상 | **미충족.** 16px(`text-base`)이 52회로 가장 많고, 14px도 25회. 버튼·입력칸·보고서 본문은 18px |
| 터치 영역 | 48×48px 이상, 주 동작은 64px 높이 | 주 버튼 64px, 입력칸 56px은 충족. 뒤로 가기 38px, 요일 버튼 44px은 미달 |
| 글자 대비 | 4.5:1 이상 | 본문·주 버튼은 충족. 오류 문구(`record`), 경고 문구(`amber-600`), 회색 보조 버튼, 입력칸 안내 글자는 미달 (위 "글자 대비") |
| 한 화면의 주 동작 | 1개 | 화면별 점검 필요 |
| 용어 | 현장 용어 그대로 (수급자, 급여제공기록지), 영어·개발 용어 없음 | "PWA", "링크" 등 점검 필요 |
| 오류 회복 | 모든 단계에서 뒤로 가기, 입력 내용 유지 | STB-3 전까지 미충족 |
| 색 외 구분 | 상태를 색만으로 구분하지 않음 | 상태 배지는 글자가 있어 충족. 녹음 완료·AI 정리중은 같은 색 |

## 기준과 다른 곳 (정리할 것)

DIF-1 개선안을 만들 때 아래부터 본다. 고칠 항목은 `DIF-1-<번호>`로 [../prd/02-requirements.md](../prd/02-requirements.md)에 올린다.

1. 16px·14px 글자를 18px 기준에 맞추기. 칩·배지처럼 보조 정보만 14px을 허용할지 정한다.
2. 대비 미달 색 고치기: 오류 문구(`record` → 더 어두운 빨강), 경고 문구(`amber-600` → `amber-700` 이상), 입력칸 안내 글자(`border` → `muted`), 회색 보조 버튼 글자.
3. 뒤로 가기 버튼(38px)과 요일 버튼(44px)을 48px 이상으로.
4. 토큰 밖 색(gray·amber·red·black/40·카카오)을 토큰으로 옮기기: `neutral-soft`, `warning`, `warning-soft`, `record-soft`, `record-dark`, `overlay`, `kakao`.
5. 모서리를 15px(`radius-card`)과 원으로 통일하고, `rounded-[15px]` 대신 토큰 클래스 쓰기.
6. 반복 패턴을 공용 컴포넌트로: `Modal`(바텀시트), `Button`의 `neutral` 종류, `ReportSection`을 `ui/`로.
7. 녹음 완료와 AI 정리중 배지 색 나누기.

## 바꿀 때

- 새 색이나 크기가 필요하면 `app/globals.css`의 `:root`에 토큰을 추가하고 이 문서의 표에 한 줄 더한다. 컴포넌트 안에 색 코드를 직접 쓰지 않는다.
- 토큰 값을 바꾸면 개발 1에게 PR 리뷰를 받는다 ([../prd/05-roadmap.md](../prd/05-roadmap.md) "파일 나누기").
- 새 컴포넌트는 Figma에서 먼저 만들고 `app/components/ui/`에 같은 이름으로 만든다 ([04-figma-workflow.md](04-figma-workflow.md)).
