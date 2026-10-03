# 손다음 문서 지도

손다음의 기획·디자인·개발 문서는 모두 이 폴더에 있다. 순서는 **요구사항 확정 → PRD → 디자인 → 스펙**이며, 아래 표의 번호 순서대로 읽으면 된다.

마지막 정리: 2026-10-03 · 기준: 해커톤 본선 제출용 프로토타입 (사용자: 요양보호사 + 보호자)

## 구조

```
docs/
├── README.md                    ← 지금 이 문서 (문서 지도)
├── prd/                         기획: 왜, 무엇을 만드는가
│   ├── 01-context.md            배경·문제·리서치·사용성 테스트 결과
│   ├── 02-requirements.md       개선 요구사항 (PRD보다 먼저 확정) + 역할 분배
│   ├── 03-legal.md              요양보호·개인정보 법령 검토
│   ├── 04-prd.md                제품 요구사항 (기능·사용자 스토리·데모 시나리오)
│   ├── 05-roadmap.md            주차별 일정
│   └── decisions.md             결정사항 기록 (무엇을, 왜 정했나)
├── design/                      디자인: 어떻게 보이고 동작하는가
│   ├── 01-design-system.md      색·글꼴·컴포넌트·고령 사용자 접근성 기준
│   ├── 02-screens.md            화면 목록 ↔ 코드 경로 ↔ Figma 프레임
│   ├── 03-ux-persona-review.md  개선 전 AI 페르소나 UX 평가 방법
│   └── 04-figma-workflow.md     Figma MCP로 화면 연동·렌더링하는 방법
└── spec/                        개발: 코드가 실제로 어떻게 되어 있는가
    ├── 01-architecture.md       기술 스택·폴더 구조·인증·배포
    ├── 02-data-model.md         DB 모델과 방문 상태 전이
    ├── 03-api.md                API 목록과 권한 확인 현황
    └── 04-ai-pipeline.md        AI 요약·개인정보 필터·암호화 흐름
```

## 어떤 문서를 볼까

| 하려는 일 | 먼저 볼 문서 |
| --- | --- |
| 팀 합류, 서비스 이해 | `prd/01-context.md` → `prd/04-prd.md` |
| 이번 주 내 작업 확인 | `prd/02-requirements.md`의 역할별 표 → `prd/05-roadmap.md` |
| 화면 고치기 | `design/03-ux-persona-review.md` → `design/02-screens.md` → `design/01-design-system.md` |
| API·DB 고치기 | `spec/03-api.md`, `spec/02-data-model.md` |
| "이거 왜 이렇게 했지?" | `prd/decisions.md` |

## 문서 규칙

- **요구사항 ID**(`SEC-1`, `DIF-3` 등)는 `prd/02-requirements.md`에서만 만들고, 다른 문서·PR·이슈에서는 ID로 참조한다.
- 결정이 바뀌면 `prd/decisions.md`에 한 줄 추가하고, 관련 문서를 같은 PR에서 고친다.
- 스펙 문서는 코드와 어긋나면 안 된다. API나 스키마를 바꾸는 PR은 `spec/`도 함께 고친다.
- 원본 자료: 발표 자료 `손다음_260829.pdf`(8/29, 14쪽), 고도화 계획 문서(10/2, Claude Docs).
