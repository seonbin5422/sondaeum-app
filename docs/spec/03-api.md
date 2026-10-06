# 03. API

API는 모두 `app/api/` 아래 Route Handler다. **지금은 요양보호사 API 3개만 세션을 확인하고, 수급자·방문·보고서 API 13개는 누구나 호출할 수 있다.** (SEC-1, SEC-3)

`세션` 칸: ✅ = `verifySession()`으로 확인 · ❌ = 확인 안 함

## 인증

| 메서드 | 경로 | 하는 일 | 세션 |
| --- | --- | --- | --- |
| GET | `/api/auth/kakao/callback` | 카카오 로그인 완료, 세션 쿠키 발급 (프로필 수정 재인증도 처리) | 해당 없음 |
| POST | `/api/auth/logout` | 세션 쿠키 삭제 | 해당 없음 |

## 요양보호사

| 메서드 | 경로 | 하는 일 | 세션 |
| --- | --- | --- | --- |
| POST | `/api/caregivers/onboard` | 이름·자격번호 등록 | ✅ |
| POST | `/api/caregivers/[id]/request-edit` | 프로필 수정 전 카카오 재인증 시작 | ✅ (본인만) |
| POST | `/api/caregivers/[id]/apply-edit` | 재인증 후 프로필 수정 적용 | ✅ |

## 수급자

| 메서드 | 경로 | 하는 일 | 세션 |
| --- | --- | --- | --- |
| POST | `/api/clients` | 수급자 등록 | ❌ |
| POST | `/api/clients/[id]/update` | 수급자 정보 수정 | ❌ |
| PATCH | `/api/clients/[id]/notes` | 지속 메모(특이사항) 저장 | ❌ |
| POST | `/api/clients/[id]/delete` | 삭제 (`isActive=false`, 복원 가능) | ❌ |
| POST | `/api/clients/[id]/restore` | 복원 | ❌ |
| POST | `/api/clients/[id]/permanent-delete` | 14일 뒤 영구 삭제 예약 (`purgeAt`) | ❌ |

## 방문·AI

| 메서드 | 경로 | 하는 일 | 세션 |
| --- | --- | --- | --- |
| POST | `/api/visits` | 방문 생성 (`RECORDING`). 요양보호사는 DB의 첫 번째로 저장 | ❌ |
| POST | `/api/visits/[id]/stop` | 기록 저장: 개인정보 필터 → 암호화 → `RECORDED` | ❌ |
| POST | `/api/visits/[id]/transcribe` | 음성 파일(≤4MB) 전사, 파일은 저장 안 함 | ❌ (Groq 비용) |
| POST | `/api/visits/[id]/classify-preview` | 저장 없이 AI 분류 미리보기 | ❌ (Groq 비용) |
| POST | `/api/visits/[id]/summarize` | AI 요약 → 보고서 생성 (`DRAFT_READY`) | ❌ (Groq 비용) |

## 보고서

| 메서드 | 경로 | 하는 일 | 세션 |
| --- | --- | --- | --- |
| PATCH | `/api/reports/[id]` | 보고서 수정 | ❌, 전송 후에도 수정됨 (STB-1) |
| POST | `/api/reports/[id]/send` | 전송 처리 (`SENT`) | ❌, 중복 전송됨 (STB-1) |

## 공개 페이지 (API 아님)

| 경로 | 하는 일 |
| --- | --- |
| `/g/[token]` | 보호자 보고서. 열 때마다 `viewCount` 증가, 첫 열람 시 `viewedAt` 기록. 미리보기 봇도 열람으로 셈 (STB-5) |

## SEC-1 이후 규칙

- 모든 API 첫 줄에서 `lib/authz.ts`의 권한 함수(예: `requireCaregiver()`, `requireOwnedClient(id)`)를 부른다. 함수 이름은 10/5에 정하고 개발 2가 구현한다.
- 새 API는 만들기 전에 경로·요청·응답을 이 문서에 먼저 적는다. 디자인은 그 모양의 임시 데이터로 화면을 먼저 만든다.
- `[id]`가 있는 API는 그 수급자·방문·보고서가 `caregiverId` 소유인지 확인하고, 아니면 `404`를 돌려준다(존재 여부를 숨김).
- AI API는 요양보호사별 호출 횟수를 제한한다.
- API를 추가·변경하면 이 문서를 같은 PR에서 고친다.
