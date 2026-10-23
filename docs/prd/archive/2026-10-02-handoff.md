# 손다음 MVP — 작업 현황 및 핸드오프 문서

**이 문서는 지속적으로 업데이트되는 작업 현황 문서입니다.** PC를 끄거나 새 세션을 시작해도
이 문서를 먼저 읽으면 어디까지 진행됐는지, 왜 그렇게 결정했는지 바로 파악할 수 있습니다.

## 작업 규칙

- 의미 있는 변경(코드 수정, 방향 전환, 결정)이 있을 때마다 **세션 종료를 기다리지 말고 즉시**
  아래 "진행 로그"에 날짜와 함께 추가한다.
- 과거 로그는 지우거나 고쳐쓰지 않고 append-only로 쌓는다.
- 각 로그 항목에는: 무엇을 왜 바꿨는지, 비직관적인 발견/결정, 다음에 할 일 또는 대기 중인 사항을
  적는다.

---

## 프로젝트 개요

**손다음** — "말 한마디면, 보고서는 AI가 작성해줍니다"

요양보호사가 하루 3~4가정을 방문하며 매번 상태를 기록해 가족(보호자)에게 전달하는 일이
번거롭다는 문제를 해결하는 서비스. 원본 기획은 `AX-TON` 폴더의 워크시트/PRD 문서
(`플랫폼기획서_손다음.txt`, `워크시트_1~3강_*.pptx`) 참고.

### MVP 핵심 기능 (이 두 가지만, 다른 건 전부 배제)

1. **녹음/업로드** — 방문 시작/종료를 수동 버튼으로 조작 (비콘 자동 연동 아님 — 정부시스템 연동
   허용 여부가 불확실해서 이번 MVP에서는 완전히 배제하기로 확정함)
2. **STT+AI요약+공유** — 음성을 텍스트로 바꾸고, AI가 식사/복약/특이사항 3항목으로 정리 →
   요양보호사가 검토·수정 → 보호자에게 전송 → 보호자가 읽었는지(열람여부/시각) 자동 기록

### 명시적으로 뺀 것 (MVP 범위 아님)

- 비콘 자동 녹음 연동
- EMR 직접 연동, 다국어, 감정분석, 통계 대시보드
- 로그인/인증 (요양보호사 1명, 어르신 2명을 시드로 하드코딩)

---

## 기술 스택 및 왜 그렇게 골랐는지

| 항목 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | Next.js 16 (App Router, TS) | 프론트+API를 한 프로젝트에서, 별도 서버 불필요 |
| DB | Prisma 7 + SQLite (`@prisma/adapter-better-sqlite3`) | 파일 기반, 별도 DB 서버 설치 불필요 |
| 스타일 | Tailwind CSS v4 | 모바일 우선 큰 터치 타겟, 빠른 스타일링 |
| AI | `groq-sdk`, `openai/gpt-oss-120b` + `response_format.json_schema`(`strict: true`, 구조화 출력) | 실제 AI 요약, 무료, 안정적 (Claude→Gemini→Groq 순으로 교체 — 아래 2026-08-13 로그 참고) |
| STT | 브라우저 Web Speech API (`webkitSpeechRecognition`) | 별도 유료 STT 서비스 없이 실제로 동작. Chrome/Edge만 지원 → 미지원 브라우저는 수동 텍스트 입력 폴백 제공 |
| 암호화 | Node 내장 `crypto` (AES-256-GCM), `lib/crypto.ts` | 방문 전사·보고서 내용을 DB에 평문으로 저장하지 않기 위한 애플리케이션 레벨 필드 암호화 |
| 개인정보 필터링 | `groq-sdk`(`openai/gpt-oss-20b`), `lib/pii.ts` | 암호화하기 전에 AI가 주민번호·전화번호·주소·제3자 실명·금전분쟁 금액 등을 `[개인정보 제외]`로 치환. 건강/돌봄 정보는 보존 |

### ⚠️ Next.js 16 관련 비직관적인 함정 (다음에 코드 건드릴 때 주의)

- **Prisma 7은 완전히 새로운 클라이언트 아키텍처.** `generator client { provider = "prisma-client" }`
  이고 `output = "../app/generated/prisma"`로 커스텀 경로에 생성됨. `@prisma/client`에서 바로
  import 하는 게 아니라 `@/app/generated/prisma/client`에서 import해야 함.
- **Prisma 7의 PrismaClient는 `new PrismaClient()`만으로 안 됨** — driver adapter가 필수.
  `@prisma/adapter-better-sqlite3`의 `PrismaBetterSqlite3` (대소문자 주의: `SQLite`가 아니라
  `Sqlite`)를 사용 (`lib/prisma.ts`, `prisma/seed.ts` 참고).
- **DATABASE_URL의 `file:./dev.db`는 프로젝트 루트 기준**으로 해석됨 (Prisma 구버전처럼
  `prisma/` 폴더 기준이 아님). 실제 DB 파일은 `sondaeum-app/dev.db`에 있음.
- **시드 명령은 `package.json`이 아니라 `prisma.config.ts`의 `migrations.seed`에 설정.**
  `ts-node`는 생성된 클라이언트가 ESM(`import.meta.url` 사용)이라 CommonJS 강제 옵션과 충돌 →
  `tsx`로 교체함.
- **Next 16에서 `params`/`searchParams`는 항상 Promise**. 모든 페이지에서
  `PageProps<'/경로'>` 헬퍼 타입 사용 (타입은 `next dev`/`next build` 실행 시 자동 생성됨).
- **Prisma로 직접 DB를 읽는 Server Component는 기본적으로 정적 렌더링될 위험이 있음**
  (Next가 ORM 호출을 동적 신호로 인식하지 못함). 그래서 DB를 읽는 모든 페이지에
  `export const dynamic = "force-dynamic";`을 명시적으로 추가함 — 이거 빼먹으면 데이터가
  빌드 시점으로 캐시되어 안 바뀌는 버그가 생길 수 있음.
- API 라우트(mutation)는 대부분 순수 HTML `<form action="/api/...">` + 303 redirect 패턴을
  씀 (JS 없이도 동작, progressive enhancement). 클라이언트 상태가 필요한 화면(녹음, AI처리중,
  검토)만 별도 client component로 분리.
- **⚠️ Gemini(`@google/genai`)는 시도했다가 폐기함.** 2026-08 기준 Google AI Studio가 발급하는
  새 `AQ.`형식 키가 `generativelanguage.googleapis.com`(Gemini Developer API)에서
  `401 ACCESS_TOKEN_TYPE_UNSUPPORTED`로 거부되는 구글 쪽 알려진 전환기 버그가 있음(구글도
  공식 인정, 미해결). 다음에 혹시 Gemini로 되돌리고 싶다면 이 문제가 해결됐는지 먼저 확인할 것.
- **현재는 `groq-sdk` 사용 중.** import는 `import Groq from "groq-sdk"`, 클라이언트는
  `new Groq({ apiKey: process.env.GROQ_API_KEY })`. Groq는 OpenAI 호환 API라 `chat.completions.create()`
  형태로 호출. 구조화 출력은 `response_format: { type: "json_schema", json_schema: { name, strict: true, schema } }`
  — **`strict: true`(스키마 100% 보장)는 `openai/gpt-oss-20b`, `openai/gpt-oss-120b` 모델만
  지원**하므로 이 두 모델 중 하나를 써야 함(다른 모델은 best-effort라 가끔 스키마를 어길 수 있음).
  결과는 `completion.choices[0].message.content`를 `JSON.parse()`. 키 형식은 `gsk_...`로
  안정적임. 발급: https://console.groq.com/keys (구글/깃허브 로그인, 카드 불필요).
- **⚠️ `dev.db`를 지울 때는 반드시 먼저 `npm run dev` 프로세스를 완전히 종료할 것.** 서버가
  실행 중인 상태로 `Remove-Item dev.db`를 돌리면 Windows 파일 잠금 때문에 삭제가 조용히
  실패하는데, `-ErrorAction SilentlyContinue`를 쓰면 그 실패조차 안 보여서 "삭제했다고 착각"하기
  쉽다(실제로 한 번 이렇게 삽질함 — 기존 평문 데모 데이터가 그대로 남아있는데 새로 초기화한
  줄 알고 헤맴). 순서: 서버 프로세스 종료 → `dev.db` 삭제(에러 안 삼키고 확인) →
  `migrate dev` → `db seed` → 서버 재시작.
- **`ENCRYPTION_KEY`는 base64로 인코딩된 32바이트(256비트) 문자열.** 생성:
  `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
  `lib/crypto.ts`의 `encryptText()`/`decryptText()`/`safeDecryptText()`가 이 키로
  AES-256-GCM 암복호화를 수행. 쓰기 경로(`stop`, `summarize`, `reports PATCH`)에서
  `encryptText()`, 읽기 경로(review/confirm/guardian 페이지)에서 `safeDecryptText()`를
  호출. `.ts` 스크립트로 DB 값을 직접 확인할 때는 `tsx`가 `.env.local`을 자동으로 읽지
  않는다는 점 주의(Next.js는 자동으로 읽지만 순수 `tsx` 실행은 아님) — 직접 파싱해서
  `process.env`에 넣어줘야 함, 이때 파일의 줄바꿈이 `\n`/`\r\n` 혼용일 수 있으니
  `split(/\r?\n/)`로 나눠야 함(안 그러면 마지막 줄에 `\r`가 남아 정규식 매칭이 조용히
  실패함 — 실제로 이 문제로 "복호화 오류"를 진짜 버그로 착각해서 시간을 허비함).

---

## 실제 케어 앱 UX 리서치 (Chrome으로 직접 조사함)

Google Play에서 **케어포 가족돌봄**, **스마트장기요양**(국민건강보험공단) 앱 스크린샷을
직접 확인하고 다음을 디자인에 반영함:

- 인사말 배너 "안녕하세요 OOO님" + 상태 안내 콜아웃 카드 (초록색 배경)
- 초록/청록 포인트 컬러, 흰 카드 + 연한 배경
- 상태를 알약(pill) 형태 배지로 표시
- 아이콘+라벨 조합으로 항목 구분 (우리는 🍚식사 💊복약 📝특이사항)

→ 이 패턴들이 `app/components/ui/StatusBadge.tsx`, `app/components/ReportSection.tsx`,
`app/components/ui/Card.tsx`(Callout)에 반영되어 있음.

---

## 현재 상태 (2026-08-13 기준)

### 완료됨 ✅

전체 흐름이 **실제로 동작**함을 Chrome + DB 직접 조회로 검증 완료:

홈(어르신 목록) → 방문 시작 → 녹음(수동, Web Speech API) → 방문종료 → AI 처리중 화면 →
검토/수정(식사·복약·특이사항) → 전송 확인 → 전송완료 → 보호자 공개 링크 →
열람 시 `viewedAt`/`viewCount` 자동 기록 (재방문 시 카운트만 증가, 최초 열람 시각은 고정됨을
DB에서 직접 확인함)

**AI 요약도 실제 Groq API로 완전히 검증 완료.** 실제 방문 대화체 문장("아침에 죽을 다 드셨고
점심은 반찬을 골라 절반만... 저녁약은 아직 안 드셔서... 어제 무릎 아프다던 게 오늘은 괜찮다고")을
넣었을 때 식사/복약/특이사항 3항목으로 정확하게, 사실 왜곡 없이 정리되는 것을 확인함 — 저녁약
미복용 같은 후속조치 필요 정보까지 놓치지 않고 잡아냄.

`npx tsc --noEmit`, `npx eslint .` 모두 통과.

**개인정보 암호화도 적용 및 검증 완료.** `Visit.transcript`, `Report.meals/medication/notes/aiRawJson`이
DB에 평문이 아니라 AES-256-GCM 암호문(base64)으로 저장됨을 `dev.db`를 직접 열어 확인했고,
화면(검토/확인/보호자)에서는 정상적으로 복호화되어 보이는 것도 확인함. 음성 파일 자체는 원래
저장하지 않으므로("음성 암호화" 요청은 실제로는 텍스트 데이터 암호화로 해석해 적용함) 이걸로
개인정보보호 관련 구멍이 메워짐.

**암호화 전 AI 개인정보 필터링도 추가 및 검증 완료.** 텍스트가 암호화되는 세 지점(방문 종료 시
전사문 저장, AI 요약 결과 저장, 검토 화면에서 캐어기버가 수정한 내용 저장) 모두에서 암호화
직전에 `redactPii()`가 먼저 실행됨. 전화번호·구체적 주소·제3자 실명·금전분쟁 구체적 금액이
섞인 가짜 전사문으로 실제 테스트한 결과, 해당 정보만 정확히 `[개인정보 제외]`로 치환되고
식사·복약·건강상태·정서상태 같은 돌봄 관련 정보는 전혀 손상되지 않고 그대로 보존됨을 확인함.
필터링 실패 시 원문을 그대로 저장하는 대신 저장 자체를 막음(fail-closed).

### 아직 안 된 것 ⚠️

- Firefox/Safari에서 수동 텍스트 입력 폴백 UI가 실제로 뜨는지는 코드 로직상으로는 맞지만
  실기기 테스트는 아직 안 함.

### 데모 데이터

시드된 요양보호사 "김미경", 어르신 "박말순 어르신"(보호자 박현우), "이순자 어르신"(보호자
이지은)만 존재. 암호화 적용하면서 `dev.db`를 완전히 초기화했으므로 이전 테스트 방문/보고서는
전부 사라짐 — 현재는 방문 기록 없는 깨끗한 상태에서 시작.

---

## 재개 방법 (다음에 이어서 작업할 때)

**PC에서만 볼 때** (HTTPS 불필요, 가장 간단):
```powershell
cd "C:\Users\leele\OneDrive\Desktop\AX-TON\sondaeum-app"
npm run dev
# http://localhost:3000 접속
```

**휴대폰에서 같은 와이파이로 접속할 때** (마이크=Web Speech API는 HTTPS 없이는 동작 안 함,
아래 "PWA/휴대폰 접속" 섹션 참고):
```powershell
cd "C:\Users\leele\OneDrive\Desktop\AX-TON\sondaeum-app"
npx next dev --experimental-https --experimental-https-key ./certificates/localhost-key.pem --experimental-https-cert ./certificates/localhost.pem
# PC: https://localhost:3000
# 휴대폰(같은 와이파이): https://<PC의 LAN IP>:3000
```

- DB 스키마 바꾸면: `npx prisma migrate dev --name <이름>`
- 시드 다시 실행: `npx prisma db seed`
- DB 내용 눈으로 보기: `npx prisma studio`
- API 키는 이미 `.env.local`의 `GROQ_API_KEY=`에 설정되어 있음 (발급된 상태).
  키 재발급/확인: https://console.groq.com/keys

## 핵심 파일 위치

- `prisma/schema.prisma` — 데이터 모델 (Caregiver, Client, Visit, Report)
- `lib/prisma.ts` — PrismaClient 싱글턴 (adapter 설정 포함)
- `app/api/visits/[id]/summarize/route.ts` — **핵심 AI 호출부**
- `app/visit/[id]/record/RecordScreen.tsx` — Web Speech API 녹음 로직
- `app/g/[token]/page.tsx` — 보호자 공개 화면 + 열람 기록
- `app/globals.css` — 색상 테마 (초록/청록 포인트, 따뜻한 오프화이트 배경)
- `lib/crypto.ts` — AES-256-GCM 암복호화 (`encryptText`/`decryptText`/`safeDecryptText`)
- `lib/pii.ts` — 암호화 전 AI 개인정보 필터링 (`redactPii`)
- `certificates/localhost.pem`, `certificates/localhost-key.pem` — 로컬 HTTPS용 자체 서명 인증서
  (`.gitignore`에 이미 걸려 있는 `*.pem` 패턴에 포함됨, 커밋되지 않음)
- `scripts/gen-cert.js` — 위 인증서 재생성 스크립트. PC의 LAN IP가 바뀌면 이 파일의
  IP를 수정하고 `node scripts/gen-cert.js`로 다시 생성

---

### AI 누락 항목 자동 점검 기능 신규 구현 (2026-08-14)

- 원래 `플랫폼기획서_손다음.txt`(3번 항목)에는 있었지만 구현이 안 돼 있던 "AI가 비어있거나
  애매한 항목을 스스로 점검해 표시"하는 기능을 추가함. 아이디어톤 평가기준(`평가기준.png`)에서
  차별점(18점)·AI활용(20점) 배점이 크다는 걸 확인하고, 이미 기획서에 있던 이 기능을 실제로
  채우는 게 가장 임팩트가 크다고 판단해 진행.
- **AI 요약 스키마 확장**(`app/api/visits/[id]/summarize/route.ts`): `meals`/`medication`/
  `notes` 텍스트 3개는 그대로 두고, `mealsMissing`/`medicationMissing`/`notesMissing` boolean
  3개를 `strict:true` JSON 스키마에 추가. 언급이 전혀 없거나 너무 모호하면 true로 표시하도록
  프롬프트에 지시(단, 요양보호사가 의도적으로 언급 안 했을 수 있으니 "누락 = 잘못"이 아니라
  "확인 필요" 신호로만 취급).
- **저장 위치**: 스키마 마이그레이션 없이, 이미 있던 `Report.aiRawJson`(암호화된 내부용 JSON)
  안에 이 3개 플래그를 같이 저장. `meals`/`medication`/`notes`(보호자에게 실제로 보이는 필드)
  텍스트에는 절대 섞지 않음 — 사용자가 "보호자에게 전송될 때는 이 문구가 절대 보이면 안 된다"고
  명확히 요구해서, 처음부터 별도 메타데이터로만 다루도록 설계함.
- **검토 화면**(`ReviewForm.tsx`/`ReportSection.tsx`): 누락으로 표시된 항목 아래에 주황색
  글씨로 경고("⚠ 약물 복용 여부·횟수가 확인되지 않았어요" 등) 표시. 해당 항목을 직접 수정하면
  경고가 바로 사라짐(수정 = 확인했다는 의사표시로 간주).
- **전송 시 확인**: 경고가 남아있는 상태로 "보호자에게 전송"을 누르면, 네이티브 `confirm()`
  대신 화면 내 모달로 "해당 내용을 수정하지 않고 보낼까요?"를 물음. 안전한 선택("돌아가서
  확인할게요")을 크고 먼저, 실제 진행 버튼("네, 그대로 보낼게요")은 `danger` variant로 작게 —
  기존 어르신 삭제 확인 화면과 같은 강조 반전 패턴을 재사용.
- Chrome + curl로 실제 Groq 호출까지 포함해 end-to-end 검증: 식사·특이사항만 언급하고 복약을
  뺀 전사문 → AI가 정확히 `medicationMissing: true`만 표시 → 검토 화면에 해당 경고만 뜸 →
  수정 시 사라짐 → 전송 확인 모달 정상 동작(취소/진행 둘 다 확인) → confirm/보호자 화면 어디에도
  경고 문구가 전혀 노출되지 않음을 텍스트로 직접 확인.
- `npx tsc --noEmit`, `npx eslint`(변경 파일 한정) 통과.

### ⚠️ `--experimental-https`에서 리다이렉트가 항상 localhost로 나가는 버그 (2026-08-14 발견)

- **증상**: 휴대폰(LAN IP로 접속)에서 어르신 등록은 되는데(리다이렉트 목적지가 `/`라서 나중에
  홈 아이콘으로 재진입하면 결과가 보여 우연히 안 들킴), "방문 시작"을 누르면 "네트워크 서버에
  연결할 수 없어서 열 수 없다"고 뜸.
- **원인**: `next dev --experimental-https`로 띄우면 실제로 어떤 호스트(`172.30.1.14` 등)로
  접속했든 서버 내부에서 `req.url`의 호스트가 항상 `"localhost"`로 보고됨. 기존 코드가
  `NextResponse.redirect(new URL(path, req.url), 303)` 패턴을 썼는데, 이러면 리다이렉트
  Location이 `https://localhost:3000/...`로 나감 — 휴대폰 입장에서 "localhost"는 자기 자신이라
  연결이 끊김. `curl -k -v`로 실제 Location 헤더를 찍어보고 확인함(홈 화면 이동은 우연히
  눈에 안 띄었을 뿐 똑같이 깨져 있었음).
- **해결**: `lib/absoluteUrl.ts` 신규 작성 — `req.url` 대신 실제 요청의 `Host` 헤더
  (`req.headers.get("host")`)로 절대 URL을 만듦. 리다이렉트가 있는 5개 라우트
  (`app/api/visits/route.ts`, `app/api/reports/[id]/send/route.ts`, `app/api/clients/route.ts`,
  `app/api/clients/[id]/update/route.ts`, `app/api/clients/[id]/delete/route.ts`) 전부 이
  헬퍼로 교체. `curl -k -v`로 Location 헤더가 실제 접속 IP로 나가는 것 확인함.
- **다음에 새 리다이렉트 라우트를 추가할 때도 `new URL(path, req.url)`을 직접 쓰지 말고 반드시
  `absoluteUrl(path, req)`를 쓸 것** — 안 그러면 로컬(PC)에서는 멀쩡히 동작하다가 휴대폰
  접속에서만 조용히 깨지는 버그가 재발함.
- 휴대폰 접속용 LAN IP가 바뀌면(`Get-NetIPAddress`로 확인) `scripts/gen-cert.js`의 IP도 같이
  바꾸고 재발급해야 함(인증서 SAN에 IP가 박혀있음) — 2026-08-14에 실제로 IP가
  `192.168.100.100` → `172.30.1.14`로 바뀌어 있어서 인증서 재발급 + `next.config.ts`에
  `allowedDevOrigins: ["172.30.1.14"]` 추가(외부 IP에서 오는 `_next` 정적 리소스/HMR 요청이
  기본적으로 차단되는 이슈도 같이 발견해서 해결)까지 함께 처리함.

## PWA/휴대폰 접속 (2026-08-13 추가)

**목표**: 앱스토어 배포 없이, 같은 와이파이에 있는 휴대폰에서 웹앱을 홈 화면에 설치해서 쓸 수
있게 만들기 ("빠른 방법" — 인터넷 어디서나 접속되는 배포는 아니고, PC가 켜져 있고 같은
와이파이에 연결돼 있을 때만 동작함).

- **PWA 설치 가능하게 만듦**: `app/manifest.ts`(웹 앱 매니페스트), `app/icon.tsx`/
  `app/apple-icon.tsx`/`app/pwa-icon-512/route.tsx`(아이콘, `next/og`의 `ImageResponse`로
  생성), `app/layout.tsx`에 `viewport`(`themeColor`)와 `appleWebApp` 메타데이터 추가.
- **왜 HTTPS가 필수인가**: Web Speech API(마이크 녹음)는 "secure context"에서만 동작함
  (`localhost`는 예외로 허용되지만, LAN IP로 접속하는 건 일반 HTTP로는 브라우저가 막음).
  그래서 휴대폰 접속에는 반드시 HTTPS가 필요함 — 단순히 LAN IP+HTTP로 열어주는 걸로는
  마이크 기능이 아예 동작 안 함.
- **`next dev --experimental-https`(mkcert 자동 생성)는 시도했다가 포기함** — mkcert가
  로컬 루트 인증서를 설치하려고 Windows 관리자 권한(UAC) 대화상자를 띄우는데, 이게
  백그라운드/비대화형 셸에서는 응답할 수 없어서 무한 대기(hang)함.
- **대안으로 `selfsigned` npm 패키지로 직접 인증서를 만듦** (`scripts/gen-cert.js`,
  `localhost`/`127.0.0.1`/PC의 LAN IP를 SAN에 포함). mkcert의 로컬 CA 설치 단계를 건너뛰어도
  손해가 없음 — 어차피 휴대폰은 mkcert가 만든 로컬 CA도 신뢰하지 않으므로, mkcert를 쓰든
  순수 자체서명을 쓰든 휴대폰에서는 똑같이 "신뢰할 수 없는 인증서" 경고가 뜸.
  - 함정: 설치된 버전의 `selfsigned.generate()`가 `async` 함수(내부적으로 WebCrypto 사용)라
    `await` 안 하면 `Promise` 객체를 그대로 파일에 쓰려다 에러가 남. `async function main()`으로
    감싸서 해결.
- **실행 명령**: `npx next dev --experimental-https --experimental-https-key
  ./certificates/localhost-key.pem --experimental-https-cert ./certificates/localhost.pem`
  → 콘솔에 `Network: https://<LAN IP>:3000`으로 출력됨.
- **검증**: PowerShell의 `Invoke-WebRequest`는 자체서명 인증서 신뢰 예외 처리가 까다로워서
  (콜백이 실행되는 스레드에 PowerShell Runspace가 없어서 스크립트블록 콜백 자체가 실패함)
  `curl.exe -k`로 대신 확인함 — `https://localhost:3000`, `https://192.168.100.100:3000`
  둘 다 HTTP 200 정상 응답 확인.
- **한계**: 이 방법은 PC가 켜져 있고 dev 서버가 실행 중이며 휴대폰이 같은 와이파이에 연결돼
  있을 때만 동작함. PC를 끄거나 다른 네트워크(카페 와이파이, 데이터)에서 접속하려면 별도의
  "공개 배포"(Vercel 등)가 필요함 — 이건 사용자가 제시받은 두 번째 옵션이고 아직 요청받지 않음.
- **다음에 이 IP가 바뀌면**: `Get-NetIPAddress`로 새 LAN IP 확인 → `scripts/gen-cert.js`의
  IP 수정 → `node scripts/gen-cert.js`로 인증서 재생성 → 위 명령으로 서버 재시작.

---

## 진행 로그

### 2026-08-20 (계속) — 방문대상자 카드에 직접수정 가능한 "특이사항" 추가
- 사용자 요청: "방문대상자 카드"에 요양보호사가 직접 수정할 수 있는 "특이사항"(예: "딸 얘기
  싫어하심") 칸을 새로 만들어달라 — 카드 안에서 바로 입력/저장.
- `Client.personalNotes`(String?) 신규 필드 추가(마이그레이션
  `20260820071600_add_client_personal_notes`, 로컬+Turso 둘 다 반영). 방문(Visit)별 AI 요약의
  "특이사항"(Report.notes, 매 방문마다 새로 생성)과는 별개로, **어르신 개인의 지속적인
  행동/성향 메모**라는 점이 다름 — 그래서 스키마상으로도 별도 필드로 분리.
- **부분 업데이트 전용 API 신규**: `app/api/clients/[id]/notes/route.ts`(PATCH) — 이 필드
  하나만 갱신. 기존 `app/api/clients/[id]/update/route.ts`(전체 폼 POST)는 안 보낸 필드를
  전부 null로 덮어쓰는 구조라, 만약 이 라우트를 재사용했다면 카드에서 특이사항만 고칠 때마다
  다른 필드가 날아갈 위험이 있었음 — 그래서 이 필드 전용의 안전한 PATCH 라우트를 새로 만듦.
- `ClientProfileModal.tsx`에 편집 가능한 textarea + "저장하기" 버튼 추가(로컬 state로 즉시
  반영, 저장 성공/실패 문구 표시). 카드를 닫았다 다시 열어도 값이 유지되는 것 확인.
- **재발 방지 확인**: 이번엔 배포 전 로컬에서 저장→새로고침→재확인까지 마치고, 다른 필드
  (요양인정번호/스케줄/나이/성별/알레르기/병력/복용약)가 전혀 안 건드려진 것도 함께 확인한
  뒤에 배포함(직전 로그의 실수 재발 방지).
- `npx tsc --noEmit`, `npx eslint` 통과. Vercel 프로덕션 재배포 완료.
- **참고 파일**: `prisma/schema.prisma`, `app/api/clients/[id]/notes/route.ts`(신규),
  `app/components/ClientProfileModal.tsx`, `app/components/ClientCard.tsx`,
  `app/components/HomeSchedule.tsx`, `app/page.tsx`.

### 2026-08-20 (계속) — 방문대상자 카드(간단 프로필) 신규 추가
- 사용자 요청: 홈 화면 어르신 카드의 프로필 사진 원형(아바타)을 터치하면 이름·나이·성별·
  알레르기 여부·현재 병력·복용약명 메모를 보여주는 간단 프로필("방문대상자 카드")이 뜨게
  해달라. 이름/나이/성별은 "돌봄 추가하기"/"수정"에서 입력한 값과 동일해야 하고, "수정"에서
  마지막으로 저장한 값이 항상 1순위(최신값)여야 함.
- **1순위 요구사항은 별도 이력 저장 없이 자동으로 충족됨** — `Client` 테이블 자체가 항상
  "현재 값"만 들고 있고, 등록이든 수정이든 같은 레코드를 덮어쓰는 구조라서 수정 화면에서
  마지막으로 저장한 값이 곧 현재 값. 별도 버저닝/이력 로직 불필요.
- `prisma/schema.prisma`의 `Client` 모델에 `age`(Int?), `gender`(String?), `allergies`(String?),
  `medicalHistory`(String?), `medicationNotes`(String?) 5개 필드 추가. 마이그레이션
  `20260820070239_add_client_profile_fields` 생성 → 로컬 dev.db 적용 →
  `scripts/apply-turso-migration.mjs`(재사용 가능하게 남겨둔 08-20 앞선 로그의 그 스크립트)로
  원격 Turso DB에도 반영(사용자가 `!`로 직접 실행).
- `app/client/new/page.tsx`/`app/client/[id]/edit/page.tsx` 폼에 나이(숫자)/성별(선택)/
  알레르기 여부/현재 병력/복용약명 메모 입력란 추가. `app/api/clients/route.ts`(등록)/
  `app/api/clients/[id]/update/route.ts`(수정) 둘 다 이 5개 필드 파싱·저장 로직 추가.
- `app/components/ClientProfileModal.tsx` 신규 — "방문대상자 카드" 타이틀 + 이름/나이/성별/
  알레르기 여부/현재 병력/복용약명 메모를 표 형태로 표시(미입력 항목은 "미입력"으로 표시).
  `app/components/ClientCard.tsx`를 클라이언트 컴포넌트로 전환해 아바타 원형 버튼 클릭 시 이
  모달을 띄우도록 연결. `HomeSchedule.tsx`/`app/page.tsx`도 새 필드를 함께 내려주도록 수정.
- **디버깅: 스키마 변경 후 `npx prisma generate`를 했는데도 로컬 `npm run dev` 서버가 여전히
  "Unknown argument `age`" 에러를 냄.** 원인은 Next.js dev 서버(Turbopack)가 이미 메모리에 올려둔
  이전 Prisma Client 모듈을 계속 쓰고 있었던 것 — **스키마를 바꾸고 `prisma generate`를 새로
  돌린 뒤에는 `npm run dev`를 재시작해야 반영된다**는 점을 기록해둠(파일은 갱신됐지만 이미 뜬
  dev 프로세스는 재시작 전까지 모름).
- **⚠️ 검증 중 curl로 직접 update API를 테스트하다가 `careRegistrationNumber`/`scheduleLabel`을
  빼먹고 보내서 김병춘님의 실제 요양인정번호·스케줄 값이 일시적으로 null로 덮어써지는 사고가
  있었음** — 폼 기반 update 라우트는 "안 보낸 필드는 비움" 방식이라(부분 업데이트가 아님)
  테스트용 요청도 반드시 기존 필드를 전부 포함해서 보내야 함. 발견 즉시 원래 값으로 복구함.
  **다음에 curl로 이 update 라우트를 테스트할 때는 반드시 기존 필드 전체를 먼저 조회해서
  포함시킬 것.**
- Chrome + curl로 실제 저장→"방문대상자 카드" 모달에 82세/남성/페니실린/고혈압,당뇨/
  혈압약(아침 1회)이 정확히 표시되는 것 확인(단, 이 값들은 검증용으로 넣은 테스트 값이라
  실제 정보로 교체 필요). `npx tsc --noEmit`, `npx eslint` 통과. Vercel 프로덕션 재배포 완료.
- **참고 파일**: `prisma/schema.prisma`, `app/client/new/page.tsx`, `app/client/[id]/edit/page.tsx`,
  `app/api/clients/route.ts`, `app/api/clients/[id]/update/route.ts`,
  `app/components/ClientProfileModal.tsx`(신규), `app/components/ClientCard.tsx`,
  `app/components/HomeSchedule.tsx`, `app/page.tsx`.

### 2026-08-20 (계속) — 방문기록 화면 입력칸 통합(4칸→1칸)
- 사용자 요청: "출근 후 기록 화면"(건강상태/식사/복약/특이사항 4개 박스)을 텍스트 입력
  간편화를 위해 한 칸으로 줄이고, 그 한 칸에 무엇을 적어야 하는지 유도하는 안내 문구를 넣어달라
  (건강상태·혈압·배뇨·배변·식사·복약·특이사항 등).
- `app/visit/[id]/record/RecordScreen.tsx` 수정 — `FieldKey`/`FIELD_ORDER`/`FIELD_LABELS`/
  `FIELD_PLACEHOLDERS` 4분할 구조를 없애고 `note`(단일 string state) + 안내 placeholder
  (`NOTE_PLACEHOLDER`: "건강상태, 혈압, 배뇨, 배변, 식사, 복약, 특이사항 등 중요한 내용을
  적어주세요.")로 통합.
- **음성 녹음 시 실시간 AI 분류(`classify-preview`) 기능은 그대로 유지하되, 결과 병합 방식만
  변경**: 기존엔 AI가 분류한 식사/복약/특이사항을 3개 분리된 필드에 각각 채워 넣었는데, 이제는
  `appendIfPresent()`로 하나의 `note` 값에 줄바꿈으로 순서대로 이어붙임(빈 값·"특이 언급 없음"
  스킵 규칙은 그대로 유지). 이렇게 해서 음성 자동분류의 이점은 보존하면서 화면 레이아웃만
  단순화함.
- `buildTranscript()`도 `note` 하나 + 음성 메모로 단순화. `hasContent` 체크도 단일 필드
  기준으로 축소.
- Chrome + 실제 방문 플로우로 검증: 통합된 한 칸에 직접 입력 → 퇴근 및 공유 → AI 처리중 →
  검토 화면에서 여전히 식사/복약/특이사항 3항목으로 정확히 분류되는 것 확인(다운스트림 AI
  요약 로직은 원래 원문 텍스트 블록을 받아 분류하는 방식이라 입력 화면 구조 변경의 영향을
  안 받음). `npx tsc --noEmit`, `npx eslint` 통과. 테스트로 만든 방문은 검증 후 삭제.
- Vercel 프로덕션 재배포 완료.

### 2026-08-20
- **사용자가 별도로 진행하던 "디자인 수정" 작업(다른 세션/PC, Figma 와이어프레임 기반 리브랜딩
  + 예약/스케줄 기능)을 `sondaeum-app_디자인수정.zip`(Downloads 폴더)으로 받아서 현재 라이브
  앱에 병합·배포함.** 압축 해제 시 Windows 경로 260자 제한 때문에 `node_modules` 포함 전체
  압축 해제가 중간에 실패함 — `node_modules`/`.next`/`.git`을 제외하고 `System.IO.Compression.ZipFile`로
  직접 엔트리 단위 추출하는 방식으로 우회(`C:\Users\leele\sondaeum-design-update\`에 압축 해제).
- **병합 전 파일별 대조로 두 브랜치의 공통 조상(2026-08-14 시점, PII필터링+누락항목 기능
  직후)과 이후 분기 지점을 확인함.** 디자인 수정 브랜치는 이 지점에서 갈라져 나가 Figma 기반
  전체 리디자인(로고/브랜드 컬러 `#ffb133`+Pretendard 폰트, `Avatar`/`Chip`/`Field`/`Logo`/
  `PageHeader`/`ScheduleField` 등 신규 UI 컴포넌트, 홈 화면 히어로 배경, `ClientCard` 재설계,
  요양보호사 예약 캘린더(`ScheduleCalendarModal`/`Trigger`), 어르신 정보에 요양인정번호·
  연락처·돌봄계약시간 필드 추가, 방문기록 화면을 자유텍스트+음성 대신 건강상태/식사/복약/
  특이사항 구조화 입력 + 녹음 중지마다 실시간 AI 분류(`classify-preview` 신규 라우트,
  `lib/careNoteAi.ts`로 AI 요약 로직 공유화)로 전면 개편)를 진행했지만, **본 브랜치가 그 이후
  (08-18~19) 진행한 Turso/libsql DB 전환, `lib/env.ts`(`cleanEnv`, Vercel BOM 이슈 대응),
  카카오 공유 버그 수정(`ShareLinkButton`/`CopyLinkButton`/`SentActions`), 로고 추가는 포함하고
  있지 않음** — 즉 단순 덮어쓰기가 아니라 실제 3-way 병합이 필요했음.
- **보존한 부분(디자인 zip으로 덮어쓰지 않음)**: `lib/prisma.ts`/`prisma.config.ts`(libsql
  어댑터), `lib/env.ts`, `app/components/ShareLinkButton.tsx`/`CopyLinkButton.tsx`/
  `SentActions.tsx`, `app/visit/[id]/sent/page.tsx`(zip 쪽은 "전송 완료"+`ShareGuardianLinkButton`
  구버전이라 그대로 두면 08-18/19에 고친 카카오 버그·문구가 재발함), `.env`/`.env.local`.
  `package.json`은 zip에만 있던 `pretendard` 의존성만 추가하고 나머지는 라이브 앱(libsql) 것을
  유지.
- **`app/visit/[id]/review/ReviewForm.tsx`에서 발견한 실제 회귀 버그를 병합 중 직접 고침**:
  zip 버전은 전송 확인 모달의 버튼 배치가 뒤바뀌어 있었음 — "돌아가서 확인할게요"가
  `secondary`(작게), "네, 그대로 보낼게요"(위험 행동)가 `primary`(크고 강조)로 되어 있어서,
  2026-08-14에 의도적으로 정한 "안전한 선택을 크고 먼저, 위험한 진행 버튼은 작고 danger로"
  패턴과 정반대였음. 같은 디자인 브랜치의 `delete-confirm` 페이지는 이 패턴을 올바르게
  유지하고 있어서 ReviewForm 쪽만의 실수로 판단, 병합 시 zip의 새 레이아웃(PageHeader+뒤로가기,
  `text-accent-soft-foreground` 톤)은 그대로 살리고 버튼 variant만 원래 안전 패턴(primary=
  돌아가기, danger=그대로 보내기)으로 되돌림.
- **`lib/careNoteAi.ts`(zip 신규)는 `redactPii()` PII 필터링과 `mealsMissing`/
  `medicationMissing`/`notesMissing` 누락 감지를 그대로 포함**하고 있어서(요약 로직을
  라우트에서 분리한 리팩터일 뿐, 보안 기능 제거 아님) 안전하게 채택. 다만 `GROQ_API_KEY`
  읽기에 `cleanEnv()`가 안 씌워져 있어서 라이브 앱 컨벤션대로 추가함.
- **robocopy로 대량 복사할 때 `/XF page.tsx`로 `sent/page.tsx` 하나만 제외하려다 모든
  `page.tsx`(홈, 클라이언트 등록/수정, 방문 confirm/processing/record/review)까지 통째로
  제외되는 실수**를 함 — `npx tsc --noEmit`에서 `ClientCard` prop 타입 불일치로 발견,
  나머지 `page.tsx` 파일들을 경로 지정으로 개별 복사해서 해결.
- **`prisma/schema.prisma`에 `Client.careRegistrationNumber`/`phone`/`scheduleLabel` 추가 +
  마이그레이션 2개(`20260819113332_add_care_registration_and_schedule`,
  `20260819114052_add_client_phone`) 적용.** `npx prisma migrate deploy`는 `prisma.config.ts`의
  `dotenv/config`가 `.env`만 읽고 `.env.local`(Turso 값이 있는 곳)은 안 읽어서 로컬
  `dev.db`에만 적용되고 실제 앱이 쓰는 원격 Turso DB에는 반영이 안 되는 함정이 있었음(그래서
  서버 기동 시 "no such column" 500 에러 발생 — 재현하고서야 발견). 게다가 Prisma의 migrate
  엔진 자체가 `libsql://` 스킴을 인식 못해(P1013) `migrate deploy`로 Turso에 직접 적용하는 것도
  불가능함이 확인됨. **해결: `@libsql/client`로 직접 연결해 `ALTER TABLE`을 실행하는
  일회성 스크립트(`scripts/apply-turso-migration.mjs`, 이미 컬럼이 있으면 건너뛰는 안전장치
  포함)를 작성**, auto mode 분류기가 원격 DB 변경 명령을 차단해서 사용자가 `!` 프리픽스로
  직접 실행함. **다음에 Turso 쪽 스키마를 또 바꿔야 하면 `prisma migrate dev`로 로컬에서
  migration.sql만 생성하고, 실제 Turso 반영은 이 스크립트 패턴(또는 새로 만든 스크립트)을
  재사용할 것** — `prisma migrate deploy`가 Turso에는 안 먹힌다는 게 이번에 확정됨.
- **모바일 접속(HTTPS/LAN) 설정 오류를 발견해 수정함.** 디자인 zip에 들어있던
  `next.config.ts`(`allowedDevOrigins`)와 `scripts/gen-cert.js`가 이 PC가 아닌 다른 PC/네트워크의
  LAN IP(`192.168.150.138`)로 덮어써져 있었음 — 실제 이 PC의 현재 Wi-Fi IP(`192.168.100.100`,
  `Get-NetIPAddress`로 확인)와 달라서 그대로 뒀으면 휴대폰 접속이 깨졌을 것. 두 파일 모두 올바른
  IP로 고치고 `node scripts/gen-cert.js`로 인증서 재발급함. Chrome 자동화는 자체서명 인증서
  경고 인터스티셜에 CDP로 접근이 안 돼("Cannot attach to this target") HTTPS 모드 자체를 직접
  클릭 테스트하지는 못했고, 대신 일반 HTTP(`npm run dev`, `localhost`는 HTTP도 secure context라
  마이크 API 자체는 동작)로 화면/플로우를 검증함 — 실제 휴대폰에서의 HTTPS 접속은 여전히
  사용자가 직접 재확인 필요.
- **Chrome으로 실제 방문 플로우 전체를 처음부터 끝까지 클릭 테스트함**(김병춘님 대상):
  홈(새 히어로 배경+로고+예약 캘린더 모달) → 수정 화면(요양인정번호/연락처/돌봄계약시간 필드
  정상 렌더링) → 출근 → 새 구조화 기록 화면(건강상태/식사/복약/특이사항 입력) → 퇴근 및 공유 →
  AI 처리중 → 검토(실제 Groq 호출로 3항목 정상 분류) → 전송 확인 → **공유하기 화면에서
  "전송 완료"가 아니라 "공유하기" 문구, 요청형 안내문, 링크 복사/공유 버튼, "홈으로" 버튼이
  공유 전까지 비활성 상태 유지 등 08-18/19에 고친 내용이 전부 그대로 살아있음을 확인** → 링크
  복사 클릭 시 "링크가 복사되었어요" + "홈으로" 활성화 확인 → 보호자 링크(`/g/[token]`)도
  정상 복호화되어 보임. **테스트로 만든 가짜 방문/보고서는 실제 프로덕션과 공유하는 Turso DB에
  남는 것이라 검증 직후 바로 삭제함**(일회성 정리 스크립트로 해당 visit/report만 정확히 지우고
  스크립트 자체도 삭제).
- `npx tsc --noEmit`, `npx eslint .` 통과(기존에 있던 `scripts/gen-cert.js`의 require-import
  에러 3개, `app/icon.tsx`/`apple-icon.tsx`의 `<img>` 경고 2개만 남음 — 전부 이번 병합과 무관한
  기존/새 디자인 쪽의 사전 존재 이슈).
- **Vercel 프로덕션 재배포 완료**(`npx vercel --prod --yes`, 배포 ID `dpl_BW5twxEYihR6sdMqhyzXSJ1Akm3p`,
  `https://sondaeum-app.vercel.app`). 첫 시도는 또 `"Not authorized"`로 실패했다가(08-18에
  기록된 것과 동일 패턴) 원인 조사 없이 바로 재시도해서 성공 — 이 패턴이 재현성 있게
  반복되는 중. 배포 후 프로덕션 홈페이지를 curl로 직접 확인해 새 디자인(김병춘 카드, "돌봄
  추가하기" 등)이 정상 응답(200)되는 것까지 확인함.
- **다음에 이어서 볼 것**: (1) 휴대폰 실기기에서 HTTPS(`--experimental-https`) 접속이 새
  IP(`192.168.100.100`)로 정상 되는지 재확인, (2) 새로 추가된 "돌봄 계약시간"(스케줄) 값을
  기존 실제 어르신 데이터(김병춘, 박말순)에는 아직 아무도 입력 안 해서 예약 캘린더가 항상
  "예정된 돌봄이 없습니다"로 뜸 — 실제로 값을 채워 넣어야 캘린더 기능 체감 가능, (3) 새
  녹음 화면의 실시간 AI 분류(`classify-preview`, 녹음 중지마다 Groq 호출)는 로직상 정상이나
  Web Speech API 마이크 자체는 이번 자동화 세션에서 미검증(수동 텍스트 입력 경로로만 검증함).

### 2026-08-20 (계속) — 캘린더 날짜별 방문목록 자동 필터링
- 사용자 요청: "홈 화면에 등록된 어르신이 전체 다 뜨는데, 달력에서 선택한 날짜에 방문 예정인
  어르신만 자동으로 뜨게 해달라"(일회성 삭제 아니라 시스템 자동 필터링).
- `lib/schedule.ts` 신규 — `scheduleLabel`("월,목 07:00-13:00" 형식) 파싱/요일 매칭 로직을
  `isVisibleOn()`으로 공유화(기존 `ScheduleCalendarModal.tsx`에 중복돼 있던 파싱 함수를 여기로
  일원화). **돌봄계약시간을 아직 입력 안 한 어르신은 요일 필터와 무관하게 항상 표시**(사용자
  확정 사항 — 실수로 방문목록에서 사라지는 것 방지).
- `app/components/HomeSchedule.tsx` 신규(클라이언트 컴포넌트) — `selectedDate` 상태를 소유하고
  캘린더에서 날짜를 고르면 그 날짜 기준으로 홈 목록을 실시간 필터링. 기존
  `ScheduleCalendarTrigger.tsx`(달력 열기 버튼만 담당, 날짜 상태는 모달 내부에 갇혀 있어 홈
  목록에 반영이 안 되던 구조)는 삭제하고 이 컴포넌트로 대체. `ScheduleCalendarModal.tsx`는
  `selectedDate`/`onSelectDate`를 controlled prop으로 받도록 리팩터(기존엔 모달 내부
  `useState`로만 관리해서 부모가 알 방법이 없었음).
- **실제 DB를 열어보다가 예상 밖의 데이터 문제 발견**: 스케줄 없는 "박말순"(guardianName "박")
  중복 15개, "홍길동" 중복 2개가 실제 프로덕션에 쌓여있어서(테스트 중 잘못 등록된 것으로 추정)
  "스케줄 없음=항상 표시" 규칙 때문에 필터링해도 목록이 안 줄어드는 문제가 있었음. 사용자
  확인 후 완전 삭제(연결된 방문기록 5건 포함) — 지금은 김병춘/박말순 어르신/이순자 어르신만
  깔끔하게 남음.
- `npx tsc --noEmit`, `npx eslint .` 통과. Chrome으로 오늘(목요일)엔 김병춘(월,목 스케줄) 노출,
  화요일로 달력 이동하면 김병춘은 빠지고 스케줄이 화요일인 다른 어르신만 뜨는 것 직접 클릭
  검증함. Vercel 프로덕션 재배포 완료, curl로 정상 응답 확인.
- **참고 파일**: `lib/schedule.ts`(신규), `app/components/HomeSchedule.tsx`(신규),
  `app/components/ScheduleCalendarModal.tsx`(controlled로 리팩터), `app/page.tsx`(단순화),
  `app/components/ScheduleCalendarTrigger.tsx`(삭제).

### 2026-08-20 (계속) — 병합 시 놓친 회귀 버그 발견 및 수정
- **사용자가 실기기(휴대폰, 프로덕션)에서 방문 종료 시 "개인정보 필터링에 실패해 저장을
  중단했습니다" 에러로 막힌다고 리포트.** `npx vercel logs`로 실제 함수 로그를 확인해 정확한
  원인을 찾음:
  ```
  TypeError: Cannot convert argument to a ByteString because the character at
  index 7 has a value of 65279 which is greater than 255.
      at ... lib_pii_ts_...js ... authHeaders ...
  ```
  65279 = U+FEFF(BOM). "Bearer " 7글자 다음(index 7) = API 키의 첫 글자가 BOM이라는 뜻 —
  Vercel에 `vercel env add`로 값을 넣을 때 생기는, 이미 `lib/env.ts`의 `cleanEnv()`로 대응해둔
  바로 그 함정(2026-08-13 로그 참고)이 재발한 것.
- **원인은 오늘(08-20) 오전 디자인 zip 병합 때 발생한 실수였음.** 병합 시 robocopy로 대량
  복사하면서 겹치는 파일 중 "완전히 동일하다"고 판단한 파일은 제외 목록에 안 넣었는데,
  실제로는 `lib/pii.ts`와 `lib/crypto.ts` 둘 다 destination 버전만 `cleanEnv()`를 쓰고 zip
  버전은 안 쓰는 상태였음(병합 전 diff에서 이 차이를 실제로 발견하고 "destination 걸 써야 한다"고
  판단까지 해놓고, robocopy 제외 목록에 반영하는 걸 빠뜨림) — 그 결과 두 파일 모두 zip의
  cleanEnv 없는 버전으로 조용히 덮어써졌었음. `redactPii()`(개인정보 필터링, 방문종료·검토수정·
  최종요약 세 지점 전부에서 호출)가 이 경로를 타므로 실사용에서 바로 걸림.
- **`lib/pii.ts`, `lib/crypto.ts` 둘 다 `cleanEnv(process.env.GROQ_API_KEY)` /
  `cleanEnv(process.env.ENCRYPTION_KEY)`로 다시 고침.** `grep -rn "new Groq("`/`process.env.`로
  코드베이스 전체를 재검사해서 이 두 곳 외에 cleanEnv 안 씌운 env 접근이 더 없는지 확인함
  (careNoteAi.ts/prisma.ts는 이미 정상이었음).
- **Vercel 프로덕션 재배포 후, curl로 실제 `/api/visits` → `/api/visits/[id]/stop` 흐름을
  재현해 200 정상 응답(및 암호문 저장) 확인**하고 `vercel logs`에 BOM 에러가 재발하지 않는 것도
  확인함. 재현에 쓴 테스트 방문은 바로 삭제.
- **교훈: 다음에 또 이런 대량 병합(robocopy/대량 복사)을 할 때는, "두 버전이 동일해 보인다"고
  판단한 파일도 병합 직후 반드시 `grep`으로 실제 배포된 파일 내용을 재확인할 것** — 특히
  `cleanEnv`/보안 관련 wrapper처럼 겉보기엔 사소해 보이는 한 줄 차이가 로직 자체는 안 바뀌어서
  `tsc`/`eslint`로는 절대 안 잡히고, 실사용(그것도 프로덕션 env 값에 실제로 BOM이 있을 때만)
  에서만 드러남.

### 2026-08-19
- **카카오톡 링크 공유(Kakao Share `sendDefault`)를 완전히 제거하고 "이미지로 공유하기"로
  교체.** 사용자가 실사용 중 발견: 캐어기버 쪽에서는 카카오톡 공유가 정상 동작하는 것처럼
  보이지만, **수신자(보호자) 쪽에서 "카카오톡 공유 메시지 받기" 수신 동의 화면이 뜨면서
  보고서로 못 넘어가는 문제**가 있었음(Kakao Link/Feed 템플릿이 미검수 개발 단계 앱에서
  카드 메시지를 보낼 때 수신자 쪽에 뜨는 것으로 추정, 정확한 원인은 카카오 쪽 문서로 확정하지
  않음). 링크 카드 자체가 문제이므로, **일반 사진처럼 전송되는 이미지 공유**로 우회.
  - **`app/api/reports/[id]/image/route.tsx` 신규**: `next/og`의 `ImageResponse`(Satori)로
    보고서 내용(어르신 이름·방문일·식사/복약/특이사항·"손다음" 브랜드)을 PNG로 서버에서
    렌더링. 기존 `app/icon.tsx`/`app/pwa-icon-512/route.tsx`와 동일한 `ImageResponse` 패턴
    재사용.
  - **⚠️ 한글 폰트 함정**: `next/og`(Satori)는 기본으로 한글 글리프가 없는 폰트만 내장하고
    있어서 아무 조치 없이 한글을 넣으면 빈 네모(tofu)로 깨짐. `lib/ogFont.ts` 신규 —
    Google Fonts CSS2 API(`fonts.googleapis.com/css2?family=Noto+Sans+KR...&text=<실제 텍스트>`)
    를 **구버전 브라우저 User-Agent로 요청**해 `.ttf`를 받아옴(최신 UA로 요청하면 Satori가
    지원하지 않는 `.woff2`가 내려옴 — 이게 바로 CJK og-image 제작 시 흔히 걸리는 함정).
    `text` 파라미터로 실제 쓰일 글자만 넘겨 서브셋 폰트를 받으므로 매 요청마다 가볍고 빠름
    (weight 400/700 두 번 요청, 매번 실제 방문 데이터 텍스트를 합쳐서 넘김 — 방문마다 내용이
    달라서 빌드타임 사전 서브셋은 불가능, 요청마다 실시간 fetch).
  - **이미지 세로 길이를 콘텐츠 분량에 맞춰 동적 계산**(`estimateLines`/`estimateBlockHeight`,
    한글은 대부분 전각이라 "폰트 크기 ≈ 글자폭"으로 근사). 처음엔 고정 1080×1350으로
    만들었더니 내용이 짧은 보고서는 카드 아래 여백이 크게 남아 사진 메시지로 어색했음.
    첫 시도에서 헤더~카드 사이 `marginTop:48` 간격을 높이 계산식에서 빠뜨려 **하단 푸터
    문구가 캔버스 밖으로 잘려서 안 보이는 버그**가 있었음(Satori는 고정 캔버스 크기를 넘는
    내용을 그냥 잘라버림, 별도 경고 없음) — 실제 curl로 이미지를 받아 직접 눈으로 확인하고
    나서야 발견. 레이아웃의 모든 간격(padding/margin/line-height)을 상수로 다시 빼서 실측과
    맞추고, 그래도 추정치가 부족한 경우를 대비해 `SAFETY_MARGIN`(50px) 여유를 더함 — 넘치는
    것보다 여백이 남는 쪽이 훨씬 안전.
  - **`ShareReportImageButton.tsx` 신규**(기존 `ShareGuardianLinkButton.tsx`는 삭제): 이미지
    URL을 `fetch` → `Blob` → `File` 생성 → `navigator.canShare({files:[file]})`가 되면
    `navigator.share({files, title, text})`로 **OS 네이티브 공유 시트**를 띄움(카카오톡
    SDK/앱 심사 없이, 사진을 갤러리에서 공유하는 것과 동일한 경로라 수신자 쪽에 아무 동의
    화면도 뜨지 않음). 미지원 환경은 `<a download>`로 파일 다운로드 폴백 + 안내 문구.
  - **Chrome 자동화로 실제 클릭까지 검증**: 버튼 클릭 → "이미지 만드는 중..." → 실제 Windows
    OS 공유 시트가 뜸(데스크톱 Chrome도 `navigator.share({files})` 지원 확인) → 이 네이티브
    팝업은 CDP 입력을 막아서 자동화로는 끝까지 못 눌러봄(2026-08-18 로그에 기록된 것과
    동일한 자동화 한계) → Escape로 닫으면 `AbortError`로 정상적으로 idle 상태 복귀,
    "홈으로" 버튼은 계속 비활성 유지되는 것 확인(취소를 "공유 완료"로 착각하지 않음).
    **실제 안드로이드 폰에서 공유 시트에 카카오톡이 뜨고, 상대방이 사진을 동의 화면 없이
    바로 받는지는 여전히 실기기 검증 필요** — 논리상 일반 사진 공유와 동일한 경로라 문제
    없을 것으로 예상되지만 미검증.
  - curl로 짧은 보고서/긴 보고서(특이사항 2줄 wrap) 둘 다 이미지를 직접 받아 눈으로 확인 —
    한글·이모지·볼드/레귤러 두 폰트 굵기·자동 줄바꿈·동적 높이 전부 정상.
  - `npx tsc --noEmit`, `npx eslint .` 통과(기존에 있던 `scripts/gen-cert.js` require-import
    에러 3개, `app/page.tsx`의 `<img>` 경고 1개만 남음 — 둘 다 이번 작업과 무관한 기존 이슈).
  - **참고 파일**: `app/api/reports/[id]/image/route.tsx`(신규), `lib/ogFont.ts`(신규),
    `app/components/ShareReportImageButton.tsx`(신규, `ShareGuardianLinkButton.tsx` 대체),
    `app/components/SentActions.tsx`, `app/visit/[id]/sent/page.tsx`.
  - **트레이드오프**: 이미지 공유로는 보호자가 `/g/[token]` 링크를 직접 열지 않으므로
    `Report.viewedAt`/`viewCount` 열람 추적이 안 됨. "보호자 확인용 링크" 카드와
    "링크 복사하기" 버튼은 그대로 남겨뒀으니, 열람 추적이 필요하면 캐어기버가 링크도 같이
    보내면 됨 — 이번엔 "보고서가 실제로 보이게 하는 것"이 우선이라 이미지 공유를 기본
    동선으로 바꾸고 링크는 보조 수단으로 유지하는 선택을 사용자가 확인함.
  - **⚠️ 배포 후 실기기 테스트에서 후속 버그 발견 및 수정 (같은 날)**: 사용자가 실제 폰으로
    확인해보니, OS 공유시트는 뜨고 카카오톡 아이콘도 보이는데 **탭해도 카카오톡의 "대화상대
    선택" 화면이 열리지 않는** 문제가 있었음. 원인 조사 결과 — `navigator.canShare({files})`는
    `files`만 검증하고 `title`/`text`는 검증 대상이 아닌데, 실제 `navigator.share()` 호출에는
    `files`와 `title`/`text`를 같이 넘기고 있었음. **Android `ACTION_SEND` 인텐트는 원래
    `EXTRA_TEXT`+`EXTRA_STREAM`(파일)을 동시에 넣는 걸 허용하지 않는 조합**이라, Chromium이
    이 조합을 그대로 하나의 인텐트에 욱여넣으면 앱마다 처리가 제각각이 됨 — 카카오톡처럼 순수
    이미지 공유만 기대하는 앱은 아이콘은 리졸버 목록에 뜨지만 실제로 열었을 때 정상 동작
    안 하는 것으로 추정. **`ShareReportImageButton.tsx`에서 `navigator.share({ files: [file] })`만
    단독으로 보내도록 수정**(`title`/`text` prop을 컴포넌트~`SentActions`~`sent/page.tsx`
    끝까지 완전히 제거 — 이미지 자체에 이미 이름/날짜/브랜드가 인쇄돼 있어 캡션 텍스트 없어도
    정보 손실 없음). `npx tsc --noEmit`/`eslint` 통과. **이 수정 이후 실기기 재검증은 아직
    안 됨** — 다음에 이 얘기 나오면 재배포 후 실제로 카카오톡 대화상대 선택 화면까지 정상
    진입하는지부터 확인할 것. 만약 이 수정 후에도 동일 증상이면 카카오톡 쪽의 다른 제약
    (이미지 포맷/크기, 특정 OS 버전)을 추가로 조사해야 함.
  - 이 수정을 Vercel 프로덕션에 재배포함(배포 ID `dpl_6VuV3iYyhv1wVVG3ugtBYagwvHxF`) —
    이번엔 `npx vercel --prod --yes`가 auto mode 분류기에 안 걸리고 바로 실행됨(매번 걸리는
    건 아닌 듯). 프로덕션 `/api/reports/[id]/image`를 curl로 재확인해 정상 응답 확인.

- **⚠️ 위 이미지 공유 기능을 배포 당일 바로 폐기하고 "링크 공유"로 다시 교체함.** 사용자가
  실기기로 테스트해보니 "이미지만 공유되니 이상하다"고 피드백 — 다시 생각해보니 애초에
  이미지 생성까지 갈 필요 없이, **카카오 SDK(카드 메시지)만 안 쓰면 순수 텍스트+URL도 OS
  공유시트로 문제없이 보낼 수 있었음**. `navigator.canShare({files})`가 `files`만 검증하고
  `title`/`text`는 검증 대상이 아니라는 점, 그리고 Android가 `EXTRA_TEXT`+`EXTRA_STREAM`
  동시 전달을 원래 지원 안 한다는 점(바로 위 항목에서 조사)이 전부 "파일이 껴 있을 때만"
  발생하는 문제라서, **파일을 아예 안 보내면(텍스트+URL만) 그 문제 자체가 성립하지 않음.**
  거슬러 올라가면 애초에 "수신 동의 화면" 버그도 Kakao Link SDK의 카드 메시지 API를 썼기
  때문이었지, OS 공유시트로 순수 텍스트/링크를 보내는 것 자체는 원래 문제가 없었음 —
  이번 세션에서 이미지 생성이라는 우회로를 탔다가 다시 원점(링크 공유)으로 돌아온 셈.
  - **`app/components/ShareLinkButton.tsx` 신규**(2026-08-18에 삭제했던
    `ShareGuardianLinkButton.tsx`와 거의 동일하되, 문제의 원인이었던 **카카오 SDK
    `sendDefault` 카드 메시지 분기를 완전히 제거**하고 `navigator.share({title,text,url})` →
    실패/미지원 시 클립보드 복사 폴백만 남김). `NEXT_PUBLIC_KAKAO_JS_KEY`/Kakao SDK
    `<Script>` 로딩 코드는 이제 어디서도 안 씀(env var 자체는 정리 안 함, 무해함).
  - **이미지 생성 관련 코드 전부 삭제**(하루 만에 폐기, 대신 "왜 안 되는지" 조사 과정과 최종
    결정 이유는 이 로그에 남겨서 다음에 또 이미지 공유를 검토하게 되면 같은 삽질을 반복하지
    않도록 함): `app/api/reports/[id]/image/route.tsx`, `app/components/ShareReportImageButton.tsx`,
    `lib/ogFont.ts` 삭제. `app/components/SentActions.tsx`/`app/visit/[id]/sent/page.tsx`는
    `imageUrl`/`imageFileName` 대신 다시 `title`/`text` prop을 받도록 원복.
  - **⚠️ Windows PowerShell 함정**: 대괄호가 포함된 경로(`app\api\reports\[id]\image\...`,
    Next.js 동적 라우트 폴더명)에 `Remove-Item`/`Test-Path`를 그냥 쓰면 PowerShell이
    `[id]`를 와일드카드 문자 클래스(예: "i 또는 d 한 글자")로 해석해서 **아무것도 안
    지워지거나 없는 파일처럼 보고**함(에러도 안 남). 실제로 `Remove-Item "app\api\...\[id]\...\route.tsx"`
    실행 후 `Test-Path`도 `False`가 나와서 "삭제 성공"으로 착각했다가, `tsc --noEmit`이 계속
    그 파일을 컴파일하려고 해서 뒤늦게 발견함. **대괄호가 든 경로는 반드시
    `-LiteralPath`를 붙여야 함**(`Remove-Item -LiteralPath ...`, `Test-Path -LiteralPath ...`).
  - `npx tsc --noEmit`, `npx eslint .` 통과(기존 알려진 이슈 2건만 남음). Chrome으로
    "링크 공유하기" 버튼 클릭 → OS 공유시트 뜸(취소 시 정상적으로 idle 복귀, "홈으로" 계속
    비활성 유지) 확인 — 실제 기기에서 카카오톡까지 정상 도달하는지는 재배포 후 사용자 확인
    필요.
  - **부수 효과(장점)**: 이미지 방식에서는 보호자가 `/g/[token]`을 안 열어서 안 됐던
    `Report.viewedAt`/`viewCount` 열람 추적이 다시 정상 작동함(보호자가 실제로 링크를
    열어야 하므로).
  - Vercel 프로덕션 재배포 완료(배포 ID `dpl_378E2hDJt28GK6eDSUDZBtKMCFqB`) — 빌드 로그의
    라우트 목록에서 `/api/reports/[id]/image`가 사라진 것 확인, `curl`로 `/sent` 페이지
    HTML을 직접 받아 "🔗 링크 공유하기" 버튼과 `title`/`text` prop이 정상 전달되는 것까지
    확인함. **실기기에서 카카오톡까지 정상적으로 열리는지는 사용자 확인 대기 중** — 다음에
    이 얘기가 다시 나오면 이 항목부터 확인할 것.
  - **Vercel 프로덕션 재배포 완료**(`https://sondaeum-app.vercel.app`, 배포 ID
    `dpl_HP1mnReeEGobn6kGgrGDNAMkFQzh`). `npx vercel --prod --yes`는 이번에도 auto mode
    분류기가 차단해 사용자가 `!` 프리픽스로 직접 실행함(2026-08-18에 기록된 것과 동일한
    제약, `vercel env add`뿐 아니라 배포 자체도 차단 대상임을 새로 확인). **첫 시도는
    `"status":"error","reason":"deploy_failed","message":"Not authorized"`로 실패했는데,
    계정/팀/프로젝트 권한(`vercel whoami`→`leelexh`, `vercel teams ls`→`hosea4`,
    `vercel project ls`→`sondaeum-app` 정상 조회, 직전까지의 배포 이력도 전부 정상)은
    전혀 문제 없었고 원인 특정 못한 채 단순 재시도만으로 바로 성공함** — 다음에 이 에러가
    다시 뜨면 권한 디버깅부터 하지 말고 먼저 그냥 한 번 더 재시도할 것(일시적인
    Vercel API 오류로 추정). 재배포 후 프로덕션 `/api/reports/[id]/image`를 curl로 직접
    호출해 로컬과 동일한 PNG가 나오는 것 확인함.

### 2026-08-18 세션 마무리
- 오늘 세션 종료 시점 상태: Vercel 실제 배포(`https://sondaeum-app.vercel.app`) + Turso DB 전환
  완료, BOM 버그·PII 필터링 오류 수정, 카카오 공유 도메인 등록, 홈 화면 로고 추가, 깨진
  테스트 데이터 정리, `워크시트_5강_손다음.pptx` 작성까지 완료. 로컬 dev 서버는 켜둔 채로
  세션 종료.
- **다음에 이어서 볼 것**: (1) "휴대폰에서 열림" 체크 — 사용자가 직접 폰으로
  `https://sondaeum-app.vercel.app` 열어보고 워크시트 체크박스 채우기, (2) 열람 기록
  (viewedAt/viewCount)을 실제 화면에 표시할지 여부 — 오늘은 "화면에는 아직 표시 안 함"으로
  피칭 대본만 정정했고 기능 추가는 보류함, (3) 카카오톡 실기기(카카오톡 설치된 폰)에서 공유
  버튼 눌렀을 때 카카오톡이 실제로 열리는지는 여전히 미검증.

### 2026-08-18 (계속)
- **홈 화면 우측 상단에 "손다음" 로고 추가.** 카카오톡으로 받은 원본 로고 파일이
  `C:\Users\leele\OneDrive\문서\카카오톡 받은 파일\logo_.svg`에 있던 것을 발견해
  `public/logo.svg`로 복사, `app/page.tsx`의 인사말 블록을 `flex justify-between`으로 감싸고
  오른쪽에 배치(`<img src="/logo.svg" className="h-8 w-auto">`). 케어로그(carelogue)와
  국민건강보험공단 노인장기요양보험 공식 앱의 홈/상단바 스크린샷을 Chrome으로 리서치 후 참고해
  배치 결정(로고는 브랜드 컬러(주황 #ffb133)를 그대로 유지, UI 기능 색(초록 accent)과는
  구분되는 브랜드 마크로 둠 — 흔한 패턴). 로컬 미리보기 + 프로덕션 배포 모두 Chrome으로
  확인. `npx tsc --noEmit` 통과, `npx eslint app/page.tsx`는 `<img>` 관련 경고 1건만
  있음(next/image 미사용 — SVG라 next/image 쓰려면 `dangerouslyAllowSVG` 설정이 추가로
  필요해서 이번 범위에서는 plain `<img>`로 유지, 에러 아님).
  - **참고**: 앱 아이콘/파비콘(`app/icon.tsx` 등, 초록 배경에 흰 "S")은 이번 요청 범위 밖이라
    안 건드림 — 필요하면 나중에 이 로고로 교체 논의 가능.

### 2026-08-18
- **`/visit/[id]/sent` 화면의 "전송 완료" 제목을 "공유하기"로 수정.** 공유 버튼 클릭 시
  실제로는 카카오 SDK `sendDefault()` 호출(응답 콜백 없음)이나 클립보드 복사 성공 시점에만
  `onShared`가 불려서 "실제 상대방에게 전달됐다"는 보장이 없는데, 화면 중앙 큰 제목이
  "✅ 전송 완료"라고 단정적으로 표시하는 게 오해의 소지가 있다고 사용자가 지적함.
  - 1차 시도: `SentActions.tsx`의 공유 버튼 아래 작은 안내문("✅ 공유 완료")만 "공유하기"로
    바꿨었는데, 사용자가 의도한 건 그게 아니라 **화면 중앙의 큰 제목**(`app/visit/[id]/sent/page.tsx`
    `<h1>전송 완료</h1>`, `text-2xl font-bold`)이었음 — 되돌리고 작은 안내문은 아예 삭제,
    `<h1>` 텍스트만 "공유하기"로 교체(크기/굵기는 기존과 동일하게 유지).
  - `StatusBadge.tsx`의 `SENT: "전송 완료"`(다른 화면의 상태 배지 라벨)는 이번 요청 범위 밖이라
    건드리지 않음.
  - 이미 SENT 상태인 방문(`/visit/cmsy5hsh1000ad0veb0o2t5of/sent`)으로 바로 접속해 카카오톡
    공유 버튼 클릭 전/후 화면을 Chrome으로 직접 확인 — 제목이 계속 "공유하기"로 유지되고,
    클릭 후 "홈으로" 버튼만 활성화(초록색)되는 것을 스크린샷으로 검증함.
- **같은 화면의 안내 문구도 같은 이유로 수정.** `{guardianName}님께 방문 보고서를
  전달했습니다.`(완료 단정형, 보호자 이름 포함)를 `보호자님께 방문 보고서를
  전달해주세요.`(요청형, 이름 제거)로 변경 — 실제로 전달됐다는 보장이 없다는 동일한 논리.
  Chrome으로 반영 확인함.
- **"보호자 확인용 링크" 아래 "🔗 링크 복사하기" 버튼 신규 추가.** 기존엔 링크를 누르면
  페이지 이동만 되고 복사할 방법이 없었음(사용자 지적). 신규 `app/components/CopyLinkButton.tsx`
  (client component) — `navigator.clipboard.writeText()` 호출, 성공 시 "링크가 복사되었어요.",
  실패 시 "복사에 실패했어요." 2.5초간 표시(`ShareGuardianLinkButton`의 클립보드 폴백과
  동일 패턴). `app/visit/[id]/sent/page.tsx`의 Card 안 링크 바로 아래 배치.
  - Chrome `javascript_tool`로 버튼 클릭 후 `navigator.clipboard.readText()`를 직접 호출해
    클립보드에 정확한 보호자 링크가 담기는 것을 확인함. 화면의 "복사되었어요" 안내문 자체는
    2.5초 타이머라 스크린샷 도구 왕복 지연 때문에 캡처 타이밍을 못 맞췄을 뿐, 기능은 정상.
- **Vercel 실제 공개 배포 완료.** URL: `https://sondaeum-app.vercel.app` (Vercel 계정: hosea4,
  프로젝트: sondaeum-app). 사용자 요청으로 진행 — 2026-08-17 로그에 남겨뒀던 "진짜 공개 배포는
  아직 시도 안 됨" 항목 해소.
  - **1차 배포(SQLite 그대로)는 구조적으로 실패.** `dev.db`를 그대로 올렸더니: (1) Vercel 배포
    디렉터리(`/var/task`)가 읽기 전용이라 SQLite가 파일을 못 열어서 500(`SQLITE_CANTOPEN`) →
    `/tmp`로 복사해서 여는 방식으로 우회했으나, (2) 서버리스 인스턴스마다 `/tmp`가 완전히
    분리되어 있어서 "방문 시작"(쓰기)이 인스턴스 A의 `/tmp/dev.db`에만 반영되고, 바로 이어지는
    "녹음 화면"(읽기) 요청이 인스턴스 B로 가면 그 인스턴스는 시드 데이터만 든 자기 `/tmp`를 봐서
    방금 만든 방문을 못 찾고 404가 남(5회 반복 확인, 매번 재현). **SQLite(파일 하나를 한
    프로세스가 물고 있는 구조)는 서버리스와 근본적으로 안 맞는다는 결론.**
  - **Turso(호스팅 libSQL)로 전환해 해결.** `lib/prisma.ts`/`prisma/seed.ts`를
    `@prisma/adapter-better-sqlite3` → `@prisma/adapter-libsql`로 교체(`TURSO_DATABASE_URL`/
    `TURSO_AUTH_TOKEN` env, 로컬 미설정 시 `file:./dev.db`로 폴백). `next.config.ts`의
    `serverExternalPackages`/`outputFileTracingIncludes`(dev.db 번들링용)도 정리.
    `better-sqlite3`/`@prisma/adapter-better-sqlite3` 패키지 제거.
  - **Turso CLI는 Windows 미지원**(공식 릴리스에 Windows 바이너리 없음, Mac/Linux만) — 웹
    대시보드(app.turso.tech)로 DB 생성. **대시보드 자체가 Claude in Chrome 자동화 세션에서
    "insertBefore" React 크래시로 여러 번 실패** — 원인은 이 자동화 세션이 보안상
    `document.cookie` 읽기를 차단해서(Turso 대시보드가 쿠키 기반 인증 상태를 읽으려다 실패)로
    추정. **DB 생성 자체(버튼 클릭)는 사용자가 직접 진행**, 이후 URL/토큰 확보부터는 자동화로
    이어감(단, JWT 토큰 값도 자동화 세션에서 JS로 읽으면 `[BLOCKED: JWT token]`으로 막혀 있어서
    사용자가 채팅으로 직접 붙여넣어 전달함).
  - **스키마+데이터 이전은 Turso 웹 대시보드의 "SQLite 파일 업로드" 기능도 같은 쿠키 문제로
    크래시** → 대신 Turso의 HTTP 파이프라인 API(`POST {url}/v2/pipeline`, Hrana 프로토콜)를
    직접 호출하는 방식으로 우회. Node 24 내장 `node:sqlite`로 로컬 `dev.db`의
    스키마(`sqlite_master`)와 전체 데이터를 SQL 문자열 78개로 덤프(FK 의존 순서: Caregiver →
    Client → Visit → Report) → HTTP API로 그대로 재생. 이전 후 행 수 대조로 검증
    완료(Caregiver 1 / Client 8 / Visit 39 / Report 21, 로컬과 정확히 일치).
  - **Prisma CLI(`db push`/`migrate`)는 `libsql://` 원격 URL을 직접 지원하지 않음**
    (`P1013: The provided database string is invalid. The scheme is not recognized`) — CLI
    스키마 엔진은 SQLite `file:` 경로 전용이라, 위처럼 HTTP API 직접 호출로 우회한 것. 다음에
    스키마를 바꿀 때도 `prisma migrate dev`는 로컬 `dev.db` 대상으로만 돌리고, Turso 쪽 반영은
    같은 방식(HTTP 파이프라인 API로 DDL 재생)으로 수동 동기화해야 함.
  - **환경변수 값에 BOM(U+FEFF)이 섞여 들어가는 문제 발견.** 사용자가 PowerShell에서
    `"값" | npx vercel env add NAME production` 패턴으로 값을 넣었는데, `TURSO_DATABASE_URL`
    값 앞에 보이지 않는 BOM 문자가 붙어서 Prisma가 `URL_INVALID`로 거부함(런타임 로그의
    `'﻿libsql://...'`로 확인). 근본 원인(PowerShell 파이프 인코딩) 대신 코드 쪽에서
    방어적으로 해결 — `lib/prisma.ts`에 `clean()` 헬퍼를 추가해 env 값의 선행 BOM과
    앞뒤 공백을 항상 제거하도록 함. **다음에 또 `vercel env add`로 값을 넣을 때 이 문제가
    재발할 수 있음을 감안할 것.**
  - **`vercel env add` 등 시크릿 값이 포함된 명령은 Claude Code auto mode 분류기가 차단함**
    (API 키 리터럴이 명령어에 보이면 막힘) — 이런 명령은 항상 사용자가 `!` 프리픽스로 직접
    실행해야 함. 계정 로그인류(`vercel login`, Turso 웹 대시보드 로그인/DB 생성 버튼)도 동일하게
    사용자가 직접 진행.
  - 최종 검증: 프로덕션 URL에서 `curl`로 방문 생성(POST `/api/visits`) → 리다이렉트된 녹음
    화면을 8회 연속 요청 모두 200 확인 + Chrome으로 "방문 시작" 버튼 실제 클릭 후 녹음 화면
    정상 진입 확인. 1차 배포 때 재현되던 404가 더 이상 발생하지 않음.
  - **참고 파일**: `lib/prisma.ts`, `prisma/seed.ts`, `prisma.config.ts`(datasource url이
    `TURSO_DATABASE_URL` 우선하도록 수정), `next.config.ts`, `.vercelignore`(신규,
    `.gitignore`와 별도로 Vercel 업로드 시 `dev.db` 등을 제외 안 하려고 추가했으나 현재는
    Turso로 옮겨서 사실상 불필요 — 굳이 안 지워도 무해함).
- **BOM 버그가 `GROQ_API_KEY`에도 있어서 "개인정보 필터링에 실패해 저장을 중단했습니다" 에러로
  실제 배포에서 재현됨(사용자가 직접 발견해 보고).** Vercel 런타임 로그에서
  `TypeError: Cannot convert argument to a ByteString because the character at index 7 has a
  value of 65279`(=U+FEFF) 확인 — `Authorization: Bearer ﻿gsk_...`처럼 토큰 앞에 BOM이 붙어
  Groq SDK의 fetch 헤더 인코딩이 터진 것. 같은 방식(`"값" | vercel env add`)으로 넣은 다른
  시크릿(`ENCRYPTION_KEY`, `NEXT_PUBLIC_KAKAO_JS_KEY`)도 잠재적으로 같은 문제가 있을 수 있어서
  전부 방어적으로 고침.
  - 공용 `lib/env.ts` 신규 작성(`cleanEnv()` — 선행 BOM + 앞뒤 공백 제거). `lib/prisma.ts`(기존
    인라인 처리를 이걸로 교체), `lib/pii.ts`, `app/api/visits/[id]/summarize/route.ts`,
    `lib/crypto.ts`(`ENCRYPTION_KEY`), `app/components/ShareGuardianLinkButton.tsx`
    (`NEXT_PUBLIC_KAKAO_JS_KEY`), `prisma/seed.ts` 전부 이 헬퍼로 env 값을 읽도록 통일.
  - **다음에 `vercel env add`로 새 시크릿을 넣을 때도 이 BOM 문제가 재발할 수 있음** — 새 env를
    읽는 코드는 항상 `cleanEnv()`를 거치도록 할 것(PowerShell 파이프의 인코딩이 근본 원인으로
    추정되나, 근본 수정보다 소비하는 쪽에서 항상 방어적으로 처리하는 편이 안전함).
  - **카카오 JS SDK 허용 도메인에 배포 도메인 등록 완료.** Kakao Developers(`developers.kakao.com`,
    앱 ID 1547419 "손다음") 로그인은 이미 되어 있어서 그대로 [앱] > [플랫폼 키] > JavaScript
    키 카드 "⋮" > "수정" > "JavaScript SDK 도메인"에 `https://sondaeum-app.vercel.app` 추가,
    저장 후 재조회로 반영 확인. 기존 `http://localhost:3000`, `https://192.168.150.138:3000`
    항목은 그대로 유지(로컬/폰 테스트용).
  - **재배포 후 curl + Chrome으로 전체 플로우 재검증 완료**: `curl`로 방문 생성 →
    `/api/visits/[id]/stop`(PII 필터링 포함, 200 확인) → `/api/visits/[id]/summarize`(AI 요약,
    200 확인) → Chrome으로 검토 화면(복호화된 식사/복약/특이사항 정상 표시, 무릎 통증 특이사항도
    정확히 잡아냄) → 전송 확인 → 전송완료("공유하기") → 보호자 링크(`/g/[token]`, 개인화된
    인사말 "안녕하세요, 박현우님" 정상) 전부 실제로 클릭해서 확인. Turso HTTP API로
    `Report.viewedAt`/`viewCount`/`sentAt`이 실제로 기록된 것까지 직접 조회해 확인
    (`viewCount: 1`). `npx tsc --noEmit`, `npx eslint`(변경 파일 한정) 모두 통과.
- **녹음 화면(`RecordScreen.tsx`) 녹음 전 안내 문구를 핵심 항목 유도형으로 수정.** 기존
  "녹음 시작 버튼을 누르고 방문 중 상태를 말로 남겨주세요."는 무엇을 말해야 하는지 구체적이지
  않아, AI 요약이 참고하는 핵심 3항목(식사/복약/특이사항)+건강상태를 사용자가 놓치지 않고
  말하도록 "녹음 시작 버튼을 누르고 방문 중 어르신의 건강상태, 식사여부, 복약, 특이사항 등을
  말로 남겨주세요."로 변경(사용자 요청). Chrome으로 반영 확인, `npx tsc --noEmit` 통과.
- **전송완료(`/visit/[id]/sent`) 화면에서 "홈으로" 버튼을 실제 공유 전까지 비활성화하도록 수정.**
  기존엔 화면 진입과 동시에 "홈으로" 버튼이 바로 눌려서, 요양보호사가 실제로 보호자에게
  링크를 공유하지 않고도 화면을 나가버릴 수 있었음(사용자가 직접 지적).
  - `ShareGuardianLinkButton`에 `onShared?: () => void` 콜백 추가 — 카카오 공유(`sendDefault`
    호출 시점, 응답 콜백이 없어 fire-and-forget), `navigator.share` 성공 시, 클립보드 복사
    성공 시에만 호출(복사 실패·공유 취소 시에는 호출 안 함).
  - 신규 `app/components/SentActions.tsx`(client component) — `shared` state로 공유 버튼과
    홈 버튼을 함께 관리. 공유 전에는 "홈으로" 버튼이 `disabled`(회색, 클릭 불가) + "카카오톡
    공유 또는 링크 복사 후 홈으로 이동할 수 있어요" 안내 문구 표시. 공유 완료 시 "✅ 공유 완료"
    표시 + 버튼 활성화. 기존 `LinkButton`(순수 `<Link>`라 disabled 불가)을 `Button`(네이티브
    `disabled` 지원, `router.push("/")`)으로 교체.
  - Chrome으로 실제 검증: 화면 진입 시 홈 버튼 비활성 확인 → 카카오톡 공유 버튼 클릭 → "✅
    공유 완료" 표시 및 홈 버튼 활성화 확인 → 클릭 시 실제로 홈 화면 이동 확인.
    `npx tsc --noEmit`, `npx eslint`(변경 파일 한정) 통과.

### 2026-08-17 세션 마무리
- 오늘 세션 종료 시점 상태: 홈 화면 중복 데이터 정리 완료, 카카오톡 공유(Kakao Share API) 연동
  완료, LAN IP(`192.168.150.138`)용 HTTPS 인증서 재발급 및 서버 정상 구동 확인(마지막으로
  `https://192.168.150.138:3000` 응답 200 확인함). 사용자가 다른 프로젝트 개발로 넘어가면서
  세션을 마무리함 — 다음에 이어서 작업할 내용은 아래 "재개 방법"과 이번 로그의 "미검증" 항목들
  (실기기 카카오톡 공유 확인, Firefox/Safari 폰 테스트, 실제 배포 여부 확인) 참고.

### 2026-08-17
- **외부 공개 전 최종 점검을 Chrome으로 직접 실행하며 진행** (AX-Ton 심사위원 관점 평가 요청).
  `npm run dev`로 서버 실행 후 홈→방문시작→녹음화면→(마이크 대신 `/api/visits/[id]/stop`에
  실제 방문 대화체 전사문을 직접 fetch로 주입해 STT를 시뮬레이션, 마이크 자체는 2026-08-14에
  이미 실기기로 검증 완료라 이번엔 생략)→AI처리중→검토(복약 의도적으로 언급 안 한 전사문 사용)
  →**AI 누락 감지가 정확히 "복약"만 경고로 표시하는 것 확인**→항목 수정 시 경고 즉시 사라짐
  확인→전송 확인 모달(경고 있는 상태로 전송 시도 → 모달 뜸 → "돌아가서 확인" 먼저 테스트 →
  실제로 항목 수정 후 재시도 → 경고 없어서 모달 없이 바로 최종 확인 화면으로) → 최종 전송 →
  보호자 링크(`/g/[token]`) 화면까지 전체 플로우 재검증 완료. 보호자 화면에 내부 경고 문구가
  전혀 노출되지 않음, 인사말이 보호자 이름으로 개인화됨 확인. 어르신 등록/수정/삭제-확인 화면도
  둘러봄(실제 삭제는 하지 않음). `npx tsc --noEmit` 통과, eslint는 기존에 있던
  `scripts/gen-cert.js`의 require-import 에러 3개만 남음(이번 검토와 무관, 배포 스크립트라
  영향 없음).
  - **발견 1 (우선 처리 필요): 홈 화면에 테스트용 중복 데이터가 쌓여있음.** "박말순"이 이름만
    같은 채 3건("박말순", "박말순", "박말순 어르신") 존재 — 2026-08-14 CRUD 기능 테스트 중
    등록 테스트를 하고 정리하지 않은 것으로 보임. 실제 삭제는 사용자 확인 없이 진행하지
    않음(안전 원칙) — 외부 공개/시연 전에 반드시 어르신 목록에서 중복 3건 정리 필요.
  - **발견 2 (핵심, 확인 필요): "외부 사용 가능하게"의 범위가 무엇인지 확인 필요.** 현재 상태는
    2026-08-13 핸드오프에 기록된 "PC 켜놓고 같은 와이파이에서 PWA로 접속" 방식뿐이며, 진짜
    공개 배포(Vercel 등, 인터넷 어디서나/심사 당일 심사위원 개인 휴대폰에서 접속)는 아직
    시도되지 않음. 심사 당일 심사위원이 직접 휴대폰으로 접속해봐야 한다면 이 부분부터
    처리해야 함.
  - **발견 3: "보호자에게 전송" 이후 보호자에게 실제로 링크가 전달되는 자동화 채널이 없음.**
    전송 완료 화면에 "보호자 확인용 링크 (테스트)"라는 라벨과 함께 링크가 그냥 화면에 표시될
    뿐 — 카카오톡/SMS 등으로 자동 전송되는 기능은 없어서, 실사용 시 요양보호사가 이 링크를
    직접 복사해 보호자에게 수동으로 보내야 함. MVP 범위상 당장 문제는 아니지만, "AI활용"/
    "차별점" 항목에서 심사위원이 "그래서 보호자는 이 링크를 어떻게 받나요?"라고 물어볼 가능성이
    높으므로 답변을 준비해두거나(Web Share API로 "카카오톡 공유" 버튼 정도는 짧은 시간에
    추가 가능) 발표에서 로드맵으로 명확히 언급할 것.
  - 평가기준(`평가기준.png`, 문제정의20/AI활용20/해결방식30/실행력및발표30) 기준 상세 피드백은
    세션 대화에만 기록, 이 문서에는 위 액션아이템만 남김.
- **위 발견 1, 3 처리 완료.**
  - **중복 데이터 정리**: DB 조회 스크립트로 확인해보니 "박말순"이라는 이름의 활성(`isActive:true`)
    클라이언트가 3건이었음 — 원본 시드 `seed-client-1`("박말순 어르신", 방문 10건, 유지)과
    2026-08-14 CRUD 테스트 중 생성된 방문 0건짜리 빈 중복 2건. 빈 중복 2건만 앱 자체의
    `/api/clients/[id]/delete`(소프트 삭제) 엔드포인트로 직접 호출해 정리함(원본 데이터나
    방문 기록은 전혀 건드리지 않음). "김병춘"(방문 다수 있음, 시드 아님)은 중복이 아니라서
    그대로 둠 — 필요하면 나중에 이름 표기 통일(`~어르신` 접미사) 여부 논의 가능.
  - **카카오톡 공유 버튼 신규 추가** (`app/components/ShareGuardianLinkButton.tsx`,
    `app/visit/[id]/sent/page.tsx`). Kakao SDK/JS 키 발급 없이, `navigator.share()`(Web Share
    API)를 호출 — 지원 브라우저(실제 안드로이드 폰의 Chrome 등)에서는 OS 네이티브 공유 시트가
    뜨고 카카오톡이 설치돼 있으면 공유 대상으로 바로 나타남. 미지원 브라우저는
    `navigator.clipboard.writeText()`로 폴백, 성공/실패 모두 화면 내 문구로 안내(실패 시에도
    조용히 실패하지 않도록 처리).
  - **부수 개선**: 기존엔 보호자 링크가 상대경로(`/g/[token]`)로만 표시돼 실제 문자/카톡으로
    보낼 수 없었음 — `next/headers`의 `headers()`로 요청 Host를 읽어 완전한 절대 URL로 바꿈
    (localhost/127.0.0.1은 http, 그 외는 https로 프로토콜 추정). "(테스트)" 라벨도 제거함.
  - **주의할 점**: `navigator.share()`/클립보드 관련 브라우저 네이티브 권한 팝업은 Claude in
    Chrome 자동화 환경에서 CDP 호출을 45초간 멈추게 함(사람이 없어 팝업을 닫을 수 없어서) —
    실제 사용자는 팝업에 응답하면 되니 문제 없지만, 다음에 이 화면을 자동화로 다시 테스트할 때는
    `navigator.share`/`clipboard.writeText`를 페이지 스크립트로 직접 호출하지 말고 실제 버튼
    클릭 한 번만 하고 결과를 기다리지 않는 방식으로 확인할 것.
  - `npx tsc --noEmit` 통과. **아직 실제 안드로이드 폰(카카오톡 설치된 상태)에서 공유 시트에
    카카오톡이 뜨는지는 미검증** — PWA/HTTPS로 폰 접속해서 실기기 확인 필요.
- **카카오톡 공유하기를 진짜 카카오링크(Kakao Share) API로 업그레이드함** (앱 선택 없이 바로
  카카오톡 대상자/채팅방 선택 화면으로 딥링크되도록, 사용자가 "다른 앱처럼 채팅방 바로 고르고
  싶다"고 요청).
  - **Kakao Developers 앱 생성**: developers.kakao.com에 사용자가 직접 로그인한 상태에서 Claude
    in Chrome으로 앱 생성 진행. 앱 ID `1547419`("손다음", 회사명 "손다음팀", 카테고리
    "건강/피트니스"). **"앱 대표 도메인" 필드는 비워둠** — 여기 로컬 IP 주소 URL을 넣으면
    "유효하지 않음" 에러가 났던 게 사용자가 겪은 문제였음(이 필드는 앱 생성 자체와는 무관하고
    선택 항목이라 비워도 됨).
  - **JS 키 도메인 등록은 별도 위치**: [앱] > [플랫폼 키] > JavaScript 키 카드의 "⋮" > "수정"
    으로 들어가야 "JavaScript SDK 도메인" 등록란이 나옴(앱 생성 화면의 "대표 도메인"과는 다른
    필드). 여기에 `http://localhost:3000`과 `https://192.168.150.138:3000`(현재 LAN IP) 둘 다
    등록 완료 — **LAN IP 주소도 도메인으로 정상 등록됨을 확인**(막연히 우려했던 것과 달리 문제
    없었음). LAN IP가 바뀌면 이 목록도 새 IP로 갱신해야 함.
  - JS 키: `c4b472d014869bcac7c3b1fa153dd90d` → `.env.local`에
    `NEXT_PUBLIC_KAKAO_JS_KEY`로 저장(클라이언트에 노출되는 게 정상 — JS 키는 원래 공개용이고
    보안은 도메인 등록으로 함).
  - **구현**(`app/components/ShareGuardianLinkButton.tsx`): `next/script`로 Kakao JS SDK
    2.8.2(정확한 integrity 해시는 카카오 공식 다운로드 문서 페이지에서 확인해 하드코딩)를
    로드 → `Kakao.init(JS_KEY)` → 버튼 클릭 시 `Kakao.Share.sendDefault({objectType:'feed', ...})`
    호출. 우선순위: **카카오 SDK 초기화됨 → sendDefault(카카오톡으로 바로 딥링크) → (SDK
    실패/키 없음) navigator.share → (그것도 없음) 클립보드 복사**로 3단 폴백.
  - `npx tsc --noEmit` 통과, `/sent` 페이지 HTML을 curl로 직접 확인해 Kakao SDK `<script>`
    태그(정확한 integrity 값 포함)가 렌더링되는 것까지 검증함.
  - **미검증**: 실제 폰(카카오톡 설치됨)에서 버튼을 눌렀을 때 카카오톡이 바로 열리고
    대상자/채팅방 선택 화면이 뜨는지는 자동화 환경(Claude in Chrome, 데스크톱 Chrome)으로는
    확인 불가 — 실기기 테스트 필요. HTTPS 인증서 경고 화면은 Claude in Chrome 자동화가
    보안상 클릭을 건너뛰지 않으므로, 이 부분은 항상 사용자가 폰에서 직접 "고급 > 이동" 눌러야
    함.

### 2026-08-14
- AX-TON 폴더에 `워크시트_4강_손다음.pptx`가 새로 추가돼 있음을 발견 — 아직 내용 미확인,
  다음 세션에서 검토 필요할 수 있음.
- `npm run dev`로 서버 실행 후 Claude in Chrome으로 실제 브라우저를 열어 사용자가 직접
  마이크에 대고 말하는 방식으로 **실기기 마이크 → Web Speech API STT 인식을 최초로 검증
  완료**. "할머니께서 밥을 잘 드셨고... 물을 좀 안 드시고... 열이 38도 정도..." 발화가
  실시간으로 정확히 텍스트화됨.
- 이어서 AI 요약(Groq)까지 실제 마이크 입력 기준으로 end-to-end 검증 완료 — 식사(김치
  거부/물 거부)·복약(정상)·특이사항(발열 38도, 감기 위험 우려)까지 후속조치 필요 정보를
  놓치지 않고 정확히 추출함. 이걸로 "아직 안 된 것"의 마이크 테스트 항목 해소.
- 이어서 검토 → 전송 확인 → 전송완료 → 보호자 링크(`/g/[token]`)까지 실제 마이크 데이터로
  전체 플로우 재검증. 보호자 화면에서 암호화된 내용이 정상 복호화되어 보이는 것,
  `Report.viewedAt`/`viewCount`가 DB에 실제로 기록되는 것(최초 열람 04:05:46로 고정,
  재방문 시 `viewCount`만 1→2로 증가)을 `better-sqlite3`로 직접 쿼리해서 확인함 — 임시
  점검 스크립트는 `scripts/` 밑에 만들었다가 확인 후 바로 삭제.
- `워크시트_4강_손다음.pptx`(멘토 코칭 워크시트) 내용 검토 완료. 4개 슬라이드: (1) 멘토
  피드백(비콘/보호자앱은 "보안상 이유로 추후 도입"으로 반영, 페르소나 구체화·대구경북
  요양보호사 실태조사는 "더 명확히 필요" 조건부 반영), (2) MVP 범위표(필수=음성녹음+요약화,
  **공유기능은 "나중" 분류**, 비콘은 버림, 확정 화면 4개), (3) 화면 설계 1~4(방문자
  리스트→녹음 상태→AI초안 검토/수정→전송+열람감지), (4) 첫 화면 완료 체크리스트 + 실제
  구현된 "오늘의 방문" 화면 스크린샷 첨부(현재 앱과 동일).
  - **충돌 발견**: 워크시트 3번 슬라이드가 녹음을 "자동으로 시작·종료"라고 서술 — 현재 앱의
    수동 버튼 방식과 다름. 사용자에게 확인한 결과 **수동 버튼이 실제 의도가 맞음**(비콘 배제
    결정과 세트로 확정된 것) — 워크시트 문구는 초기 기획 단계의 표현일 뿐, 코드 변경 불필요.
  - **미해결 항목**: 워크시트 3번 슬라이드가 화면3(AI 초안 검토) 데이터로 "수정 이력"을
    명시하는데, 현재 스키마엔 `Report.wasEdited` Boolean만 있고 실제 수정 이력 로그는 없음.
    사용자가 지금은 결정 보류(나중에 다시 논의) — 다음에 이 얘기 나오면 참고할 것.
  - 공유기능 "나중" 분류 vs 이미 구현된 화면4는 정보성 불일치일 뿐, 별도 조치 없음.
- **어르신(Client) 등록/수정/삭제 기능 신규 구현.** 케어포/스마트장기요양 등 참고 앱은 Play/App
  Store 공개 스크린샷에 기관 직원용 "신규 등록" 폼 자체가 노출되지 않아(모바일 화면 위주로
  재검색해봐도 마찬가지) 정확한 참고는 어려웠고, 대신 기존 손다음 디자인 시스템 + 보편적 모바일
  CRUD 관례로 설계함.
  - `Client` 스키마에 `guardianRelation`(보호자와의 관계, 아들/딸/배우자/기타+직접입력)과
    `isActive`(소프트 삭제 플래그, `@default(true)`) 추가. 기존 `guardianName` 자유텍스트
    ("박현우 (아들)")를 정규식으로 쪼개는 임시 백필 스크립트를 만들어 한 번 실행하고 바로
    삭제함 — `dev.db`의 기존 Visit/Report(오늘 마이크 테스트 데이터 포함)는 전혀 손상되지 않음
    (마이그레이션 직후 및 기능 완성 후 두 차례 DB 직접 조회로 확인).
  - 삭제는 **소프트 삭제**만 함(`isActive=false`) — 실제 row나 연결된 Visit/Report는 절대
    안 지움. 홈 목록 쿼리에 `where: { isActive: true }` 추가.
  - 우발적 삭제 방지: 홈 카드에는 편집(✏️ 수정) 버튼만 있고 삭제 버튼 없음. 삭제는
    `/client/[id]/edit` 화면 하단의 작은 링크 → `/client/[id]/delete-confirm` 확인 화면에서만
    가능. 이 확인 화면은 기존 "전송 확인" 화면과 반대로 안전한 선택("아니요, 돌아갈게요")을
    크고 먼저, 실제 삭제 버튼(`danger` variant, 이번이 첫 사용)은 작고 나중에 배치.
  - 신규 등록은 홈 화면 우측 하단 고정 "＋ 어르신 등록" pill 버튼(`/client/new`)으로 진입.
  - Chrome으로 등록→관계 select(배우자)→수정(기타+커스텀"이웃")→삭제(취소 먼저 확인 후 실제
    삭제) 전체 플로우 실제 클릭 테스트 완료, DB 조회로 소프트 삭제와 기존 데이터 보존 확인.
    `npx tsc --noEmit`, `npx eslint .` 모두 통과(기존에 있던 `scripts/gen-cert.js`의
    require-import lint 에러는 이번 작업과 무관한 사전 존재 이슈).
  - 참고 파일: `prisma/schema.prisma`, `lib/guardianRelation.ts`(신규),
    `app/api/clients/**`(신규), `app/client/**`(신규), `app/page.tsx`,
    `app/components/ClientCard.tsx`.

### 2026-08-13
- 워크시트 1~3강 + PRD 피드백 진행. 핵심 지적: 비콘을 MVP 필수 경로에서 빼고 수동 방식을
  1순위로 둘 것, KPI를 스펙이 아니라 가치검증 지표로 바꿀 것.
- 사용자가 "핵심기능 2개(녹음/업로드, STT+요약+공유)에 오차가 거의 없어야 함", "케어포/
  스마트장기요양 같은 UI", "음성요약은 수동기능"으로 확정.
- 플랜 승인 후 Next.js 16 + Prisma 7 + Tailwind v4 프로젝트를 처음부터 스캐폴딩.
  Prisma 7의 새 아키텍처(드라이버 어댑터 필수, 커스텀 클라이언트 출력 경로, `prisma.config.ts`
  기반 시드 설정) 때문에 예상보다 삽질 많았음 — 위 "비직관적인 함정" 섹션 참고.
- Chrome으로 케어포 가족돌봄 / 스마트장기요양 앱 스크린샷 직접 조사 → UI에 실제 패턴 반영.
- 전체 화면(홈~보호자뷰) 구현 완료, Chrome + DB 조회로 end-to-end 동작 검증 완료.
  AI 요약만 API 키 없어서 미검증 (에러 처리 자체는 정상 동작 확인함).
- 이 핸드오프 문서를 AX-TON 폴더에 생성 (사용자 요청 — PC 꺼도 이어서 작업 가능하도록).
- 사용자가 "Claude API 유료냐, 무료 모델 없냐"고 질문 → Google Gemini API 무료 티어(카드
  등록 불필요, `gemini-3.6-flash`, 하루 1,500회/분당 10회/분당 25만 토큰) 확인 후 사용자가
  교체를 선택. `@anthropic-ai/sdk`+`zod` 제거, `@google/genai` 설치, `summarize/route.ts`를
  Gemini 구조화 출력 방식으로 전면 재작성. `.env.local`도 `ANTHROPIC_API_KEY` →
  `GEMINI_API_KEY`로 교체.
- Claude in Chrome으로 Google AI Studio에서 실제 API 키를 발급받아 `.env.local`에 넣음.
  그런데 실제 호출해보니 **401 ACCESS_TOKEN_TYPE_UNSUPPORTED** 에러 — 조사해보니 구글이
  최근부터 새로 발급하는 키 형식(`AQ.`로 시작)이 Gemini Developer API 쪽에서 아직 제대로
  지원되지 않는 알려진 전환기 버그였음(구글 개발자 포럼에 다수 신고, 구글도 공식 인정,
  미해결 상태). 우리 코드 문제가 아니었음.
- 사용자에게 상황 설명 후 대안 3개 중 선택하게 함 → **Groq 무료 티어**로 교체 결정.
  `@google/genai` 제거, `groq-sdk` 설치, `summarize/route.ts`를 Groq의 OpenAI 호환
  `chat.completions.create()` + `response_format.json_schema(strict:true)` 방식으로 재작성
  (모델: `openai/gpt-oss-120b`, strict 모드 지원 모델 중 선택). `.env.local`도
  `GEMINI_API_KEY` → `GROQ_API_KEY`로 교체.
- Claude in Chrome으로 console.groq.com 접속 → 사용자가 직접 구글 계정으로 로그인(계정
  생성/로그인은 안전상 내가 대신 할 수 없는 단계라 사용자가 직접 진행) → 이후 "API 키 생성"
  버튼 클릭, Cloudflare 확인 통과 후 `gsk_...` 형식 키 발급받아 즉시 `.env.local`에 저장.
- **실제 Groq API로 최종 검증 완료.** 현실적인 방문 대화체 전사문을 넣어 테스트한 결과
  식사/복약/특이사항 3항목이 사실에 기반해 정확하게 정리됨(저녁약 미복용 후속조치 필요사항까지
  놓치지 않음). `tsc`/`eslint` 통과. 이제 AI 요약 기능이 **완전히 실사용 가능한 상태**.
- 사용자가 직접 처음부터 끝까지 앱을 써보고 "완벽해"라고 확인함.
- 사용자가 "음성 암호화로 개인정보보호를 보완"해달라고 요청. Plan Mode로 전환해서, 먼저
  "실제로는 음성 파일을 저장하지 않고 텍스트(전사문·AI요약)만 저장한다"는 사실을 명확히 하고
  그 텍스트를 암호화하는 방향으로 계획을 세워 승인받음. `lib/crypto.ts`(AES-256-GCM) 신규
  작성, 쓰기 경로 3곳(`stop`, `summarize`, `reports PATCH`)에 암호화, 읽기 경로 3곳
  (review/confirm/guardian 페이지)에 복호화 적용. 스키마 변경 없음(암호문도 그냥 `String`).
- 구현 중 두 가지 함정에 빠졌었음(둘 다 위 "비직관적인 함정" 섹션에 기록):
  (1) 서버가 파일을 잠그고 있는 상태에서 `dev.db`를 지우려다 `-ErrorAction SilentlyContinue`가
  실패를 숨겨서 "초기화됐다"고 착각, (2) 검증용 임시 스크립트가 `.env.local`의 줄바꿈
  혼용(`\r\n`) 때문에 키를 못 읽어서 진짜 버그처럼 보임. 둘 다 서버 프로세스를 먼저 완전히
  종료하고 파일을 다시 확인하는 방식으로 해결, 실제 앱 코드에는 문제 없었음이 최종 확인됨.
- **DB의 `Visit.transcript`, `Report.meals/medication/notes/aiRawJson`이 실제로 base64
  암호문으로 저장되고, 화면에서는 정상적으로 복호화되어 보이는 것을 직접 확인.** 개인정보보호
  보완 작업 완료.
- 사용자가 `손다음_보안설계.pptx`(11슬라이드, Secure Enclave/StrongBox 기반 오디오
  envelope encryption·Shamir 비밀분산·해시체인 감사로그를 제안하는 엔터프라이즈급 보안
  설계 문서)를 검토·적용해달라고 요청. 검토 결과: 이 설계는 **음성 파일을 실제로 저장하는
  네이티브 앱**을 전제로 하며, Secure Enclave/StrongBox는 브라우저 웹앱에서 원천적으로
  접근 불가능한 하드웨어 모듈이라 지금 구조(모바일 웹앱, 음성 파일 미저장)와 근본적으로
  안 맞음을 확인하고 사용자에게 그대로 전달함. 실제 적용 가능한 항목(동의 고지 화면, 보호자
  링크 만료)을 제안했으나 사용자가 폐기 결정 — 대신 "암호화 전에 AI가 개인민감정보를
  제외하는 기능"을 새로 요청함.
- `lib/pii.ts` 신규 작성 — `redactPii()`가 Groq(`openai/gpt-oss-20b`)로 주민번호·전화번호·
  계좌번호·구체적 주소·제3자 실명·금전분쟁 구체적 금액을 찾아 `[개인정보 제외]`로 치환.
  건강/돌봄 정보는 절대 건드리지 않도록 프롬프트에 명시. 암호화가 일어나는 3곳
  (`stop`, `summarize`, `reports PATCH`) 모두에 `encryptText()` 직전 호출로 연결.
  기존에는 실패하지 않던 `stop`/`PATCH` 라우트가 이제 실패할 수 있게 되어, 클라이언트
  쪽(`RecordScreen.tsx`, `ReviewForm.tsx`)에 `res.ok` 체크와 에러 표시를 추가함(이전엔
  응답 상태를 확인 안 하고 무조건 다음 화면으로 넘어갔었음 — 방치했으면 실패해도 사용자가
  모르고 지나갈 뻔함).
- 가짜 개인정보(전화번호, 구체적 주소, 제3자 이름, 유산분쟁 금액)를 섞은 전사문으로 실제
  테스트 → 해당 정보만 정확히 치환되고 식사·복약·건강상태·정서상태는 그대로 보존됨을 확인.
  `tsc`/`eslint` 통과.
- 사용자가 "휴대폰 앱으로 다운받아서 쓰려면 어떻게 해야하냐"고 질문 → 빠른 방법(같은 와이파이
  PWA 설치)과 공개 배포 2가지 옵션 제시, 사용자가 "일단 첫번째 방법 해주고 접속링크 보내줘"로
  빠른 방법을 선택. PWA 매니페스트/아이콘 추가, `selfsigned` 패키지로 자체서명 인증서 생성
  (mkcert는 Windows UAC 대화상자 때문에 비대화형 셸에서 무한 대기해서 포기), HTTPS로 dev
  서버 실행 후 `curl.exe -k`로 PC/LAN IP 양쪽 정상 응답 확인. 자세한 내용은 위 "PWA/휴대폰
  접속" 섹션 참고.
