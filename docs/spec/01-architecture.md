# 01. 아키텍처

손다음은 Next.js 16 App Router 하나로 화면과 API를 함께 제공하고, Vercel에 배포하며, Turso(libSQL)에 데이터를 저장한다. AI(요약·전사·개인정보 필터)는 모두 Groq API를 호출한다.

## 기술 스택

| 영역 | 기술 |
| --- | --- |
| 프레임워크 | Next.js 16.3 (App Router, TypeScript), React 19.2 |
| DB | Prisma 7 + Turso(libSQL), 로컬은 SQLite(`dev.db`) |
| 스타일 | Tailwind CSS v4, Pretendard |
| AI | Groq — 요약 `openai/gpt-oss-120b`, 개인정보 필터 `openai/gpt-oss-20b`, 음성 파일 전사 `whisper-large-v3-turbo` |
| 실시간 음성 인식 | 브라우저 Web Speech API |
| 인증 | 카카오 OAuth → JWT 세션 쿠키(`jose`, 7일) |
| 암호화 | AES-256-GCM 필드 암호화 (`lib/crypto.ts`) |
| 배포 | Vercel |

> Next.js 16은 이전 버전과 API·규칙이 다르다. 코드를 쓰기 전에 `node_modules/next/dist/docs/`를 확인한다. (`AGENTS.md`)

## 폴더 구조

```
app/
├── page.tsx                 홈 (오늘의 돌봄)
├── login/, onboarding/      로그인·온보딩
├── client/, clients/        수급자 등록·수정·삭제·관리
├── visit/[id]/              record → processing → review → confirm → sent
├── g/[token]/               보호자 공개 보고서 (로그인 없음)
├── api/                     API 라우트 (03-api.md)
├── components/              화면 컴포넌트, ui/ 는 공통 컴포넌트
└── generated/prisma/        Prisma 생성 코드 (직접 수정 금지)
lib/                         서버 로직 (AI, 암호화, 세션, 일정)
prisma/                      스키마, 마이그레이션, 시드
proxy.ts                     요청 가로채기 (로그인 확인)
docs/                        문서 (../README.md)
```

## 인증

1. `/login`에서 카카오 인가 페이지로 이동 → `/api/auth/kakao/callback`
2. 카카오 사용자 ID로 `Caregiver`를 찾거나 만들고, `caregiverId`를 담은 JWT를 `session` 쿠키(httpOnly, 7일)에 저장 (`lib/session.ts`)
3. `proxy.ts`가 공개 경로가 아니면 쿠키를 확인하고 없으면 `/login`으로 보냄
4. 서버 컴포넌트·API는 `verifySession()`(`lib/dal.ts`)으로 `caregiverId`를 얻음
5. 요양보호사 프로필 수정은 카카오 재인증을 거침 (`request-edit` → 카카오 → `apply-edit`, `lib/pendingEdit.ts`, `lib/editGrant.ts`)

**알려진 문제**: `proxy.ts`가 `/api/` 전체를 공개 경로로 두고, `verifySession()`을 쓰는 곳은 홈·온보딩·요양보호사 API뿐이다. 수급자·방문·보고서·AI API는 세션을 확인하지 않는다. → SEC-1, SEC-3

## 환경 변수

| 이름 | 용도 |
| --- | --- |
| `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` | 배포 DB |
| `DATABASE_URL` | 로컬 DB |
| `GROQ_API_KEY` | AI 호출 |
| `ENCRYPTION_KEY` | 필드 암호화 키 |
| `SESSION_SECRET` | JWT 서명 |
| `KAKAO_REST_API_KEY`, `KAKAO_CLIENT_SECRET` | 카카오 로그인 |

## 배포·개발

- 실행·명령어는 루트 `README.md`를 따른다.
- 휴대폰에서 마이크를 테스트하려면 HTTPS 개발 서버가 필요하다 (`certificates/`).
- `main`에 직접 푸시하지 않는다. 기능 브랜치 → PR. (`CLAUDE.md`)
