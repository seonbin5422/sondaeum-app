# 02. 데이터 모델

모델은 5개(`Caregiver`, `Client`, `Visit`, `Report`, `AiUsage`)다. 게시판 댓글(DIF-5) `Comment`는 아래 "게시판" 절에 있다. 원본은 `prisma/schema.prisma`이고, 바꿀 때는 `npx prisma migrate dev --name <이름>`으로 마이그레이션을 만든다.

## 관계

```
Caregiver 1 ── N Visit N ── 1 Client
                 │
                 1
                 │
               Report (0..1)
```

`Client.caregiverId`는 담당 요양보호사다 (SEC-2, D-35). 1120 화면(`app/v1120/_data.ts`)은 이 값으로 걸러서 자기 수급자만 보여 준다. 옛 화면은 아직 거르지 않고, 옛 화면이 만든 수급자는 이 값이 비어 있을 수 있다 (그래서 지금은 선택 칸).

## 모델

### Caregiver (요양보호사)

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `id` | String (cuid) | |
| `name` | String | |
| `licenseNumber` | String? | 요양보호사 자격번호. 처음 설정(C-02)에서 필수로 받는다 (D-31) |
| `kakaoId` | String? unique | 카카오 사용자 ID |
| `isDemo`, `demoExpiresAt` | Boolean, DateTime? | 체험 계정(OPS-1). 만든 지 24시간 뒤 수급자·방문 기록과 함께 지운다 (`app/api/auth/demo`, 누가 체험하기를 누를 때 정리) |
| `consentedAt`, `consentItems` | DateTime?, String? | LAW-3 동의 기록. 1120 동의 화면(C-21)에서 모든 항목에 동의한 시각과 항목 키(`personal,health,guardian,overseas`, `app/v1120/_consent.ts`). 10/13 전에 가입한 계정은 비어 있다 |

### Client (수급자)

| 필드 | 타입 | 설명 | 암호화 |
| --- | --- | --- | --- |
| `name` | String | 이름 | 아니오 (SEC-5) |
| `age`, `gender` | Int?, String? | | 아니오 |
| `allergies`, `medicalHistory`, `medicationNotes` | String? | 알레르기, 병력, 복용약 | 아니오 (SEC-5) |
| `personalNotes` | String? | 요양보호사의 지속 메모(특이사항) | 아니오 |
| `guardianName`, `guardianRelation` | String | 보고서 받을 사람(보호자) 이름, 관계. 관계는 딸·아들·배우자·이웃·친척·기타 또는 기관 사회복지사·주민센터 담당자·후견인, 받을 사람이 없으면 `없음`이고 이때 이름은 빈 글자 (D-49) | 아니오 |
| `guardianPhone` | String? | 보호자 전화번호. 게시판 초대 문자에 씀 (D-33) | 아니오 (SEC-5) |
| `careRegistrationNumber` | String? | 장기요양인정번호. 등록·수정(C-07·C-08)에서 필수 (D-31) | 아니오 (SEC-5) |
| `careGrade` | String? | 장기요양등급 `"1등급"`~`"5등급"`, `"인지지원등급"` (LAW-4, D-31) | 아니오 |
| `caregiverId` | String? | 담당 요양보호사 (SEC-2, D-35) | |
| `phone` | String? | 수급자 전화번호 (보호자 번호는 `guardianPhone`, D-33) | 아니오 (SEC-5) |
| `scheduleLabel` | String? | 돌봄 계약시간, 예: `수,금,토 17:00-23:00` (`lib/schedule.ts`가 해석) | 아니오 |
| `isActive` | Boolean | `false` = 삭제됨(복원 가능) | |
| `purgeAt` | DateTime? | 영구 삭제 예정 시각 (요청 후 14일) | |

### AiUsage (AI 호출 기록, SEC-3)

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `caregiverId` | String | 부른 요양보호사 |
| `kind` | String | `fill-record`(1120 정리), `summarize`·`classify-preview`·`redact`·`transcribe`(옛 API) |
| `createdAt` | DateTime | 부른 시각. `(caregiverId, createdAt)` 색인 |

요양보호사마다 시간당 30회·하루 100회까지 (`lib/aiLimit.ts`). 넘으면 1120 정리는 AI 없이 낱말 찾기로 채우고, 옛 API는 429를 돌려준다.

### Visit (방문)

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `caregiverId`, `clientId` | String | 지금은 `caregiverId`를 DB의 첫 요양보호사로 저장함 (SEC-2) |
| `startedAt`, `endedAt` | DateTime? | |
| `status` | VisitStatus | 아래 상태 전이 |
| `transcript` | String? | 개인정보 필터 후 **암호화**된 기록 원문 |

### Report (보고서)

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `visitId` | String unique | |
| `meals`, `medication`, `notes` | String | 식사·복약·특이사항, **암호화**. D-24 이후 새 기록은 `careRecord`에 (아래 절) |
| `medicationMorning` / `Lunch` / `Evening` / `Bedtime` / `None` | Boolean | 복약 체크박스 |
| `aiRawJson` | String? | AI 원본 응답(누락 여부 포함), **암호화**. 1120 기록은 항목별 "내가 한 말"(`SaidQuotes`) |
| `careRecord` | String? | 급여제공기록지 모양 `CareRecord` JSON, **암호화** (DIF-2, D-36). 아래 절 |
| `signatures` | String? | 급여제공기록지 확인 서명 JSON, **암호화** (LAW-9, D-48). `{ recipient: Stroke[], caregiver: Stroke[], reason }` — `Stroke`는 서명칸 비율 좌표(0~400·0~120) 점 목록, `reason`은 서명 불가 사유(200자). 비면 `null`. 1120 `saveSignatures`가 모양·크기(획 100·점 4000)를 확인하고 저장 |
| `wasEdited` | Boolean | 요양보호사가 수정했는지 |
| `shareToken` | String unique | 보호자 링크 `/g/[token]` |
| `sentAt`, `viewedAt`, `viewCount` | | 전송·첫 열람 시각, 열람 횟수 |

## 급여제공기록지 기록 (D-24, DIF-2)

기록 확인(C-14)·보내기 전 확인(C-15)·보호자 보고서(G-01)·서류 초안(DIF-3)이 같이 쓰는 방문 기록의 모양이다. 화면은 디자인이 이 모양대로 먼저 구현하고, 개발 1은 AI 요약 결과를 이 모양으로 저장하고 개발 2는 암호화를 맞춘다. 항목 정의는 [../prd/03-legal.md](../prd/03-legal.md) 1절, 순서는 [../prd/04-prd.md](../prd/04-prd.md) 3.3절.

### 저장 모양 `CareRecord`

`Report.careRecord`(String) 하나에 아래 객체를 JSON으로 **암호화**해 저장한다. 기존 `meals`·`medication`·`notes`는 이미 보낸 보고서를 보여 주는 데만 쓴다.

`null` = 아직 모름(말하지 않았고 직접 입력도 안 함) → C-14·C-15에서 "확인 필요". `false`·`0` = 안 했음.

순서와 구조는 서식 원문을 따른다: 서비스 시간 → 신체활동지원 → 인지·정서 지원 → 가사·일상생활지원 → 변화상태 → 배변 변화 → 특이사항.

```ts
type Change = "improved" | "same" | "worse"; // 호전 / 유지 / 악화

type CareRecord = {
  // 2. 신체활동지원: 항목 체크 + 합계 제공시간
  physical: {
    personalHygiene: boolean | null; // 개인위생 (옷 갈아입기·세면·구강청결·몸단장)
    bathing: boolean | null;         // 몸 씻기 도움
    mealAssist: boolean | null;      // 식사 도움 (식사량은 physicalNote에)
    repositioning: boolean | null;   // 체위변경
    mobility: boolean | null;        // 이동 도움
    toileting: boolean | null;       // 화장실 이용하기
    minutes: number | null;          // 제공시간 (분). 활동마다 말한 시간을 더한 합계 (D-42)
  };
  physicalNote: string | null;       // 한 일을 한두 문장으로 (G-01 신체활동 카드 아래 문장)

  // 3. 인지·정서 지원: 항목별 분
  cognitive: {
    stimulation: number | null;      // 인지활동지원 > 인지자극활동
    dailyLiving: number | null;      // 인지활동지원 > 일상생활 함께하기
    behaviorManagement: number | null; // 인지관리지원 > 인지행동변화 관리 등
    emotional: number | null;        // 정서지원 > 의사소통 도움·말벗·격려
  };

  // 4. 가사 및 일상생활지원: 항목 체크 + 합계 제공시간
  household: {
    mealPrepCleaningLaundry: boolean | null; // 식사준비, 청소 및 주변정리 정돈, 세탁 등
    personalActivity: boolean | null;        // 개인활동지원 (외출 시 동행 등)
    minutes: number | null;                  // 제공시간 (분). 활동마다 말한 시간을 더한 합계 (D-42)
  };

  // 5. 변화상태: 요양보호사가 직접 고름, AI는 채우지 않음
  change: {
    physical: Change | null;         // 신체기능
    meal: Change | null;             // 식사기능
    cognitive: Change | null;        // 인지기능
  };

  // 6. 변화상태 > 배변변화 (횟수)
  bowel: {
    stoolAccidents: number | null;   // 대변 실수
    urineAccidents: number | null;   // 소변 실수
    diaperChanges: number | null;    // 기저귀 교환 (기저귀를 쓰는 분만)
  };

  // 7. 특이사항: 혈압·복약도 여기에 (D-43)
  notes: string | null;              // 기록지·진료 참고용 요약에 쓰는 기록체("~함"). 관찰 → 도움·조치 → 전달 순서
  guardianNotes?: string | null;     // notes와 같은 문장을 보호자용 '~요'체로. 특이사항을 직접 고치면 null → notes를 보여 줌
  notesNoAction?: boolean;           // AI 판단: 관찰만 있고 요양보호사가 한 도움·조치가 없음 → C-14에서 더 말하도록 안내
  notesAsk?: string | null;          // notesNoAction일 때 무엇을 더 말할지 묻는 한 문장 (예: "무릎이 아프다고 하셨을 때 어떻게 도와드렸나요? (예: 쉬시게 함, 찜질, 보호자에게 알림)")
};
```

1번 서비스 시간은 따로 저장하지 않고, 수급자를 등록할 때 정한 계약 시간(`Client.scheduleLabel`의 시작~끝)을 방문한 날에 놓아 계산한다 (`app/v1120/_data.ts`의 `serviceTimeOf`, D-37). `Visit.startedAt`·`endedAt`은 기록을 시작·끝낸 시각이라 서비스 시간이 아니다.

### 보호자 보고서 화면(G-01)이 받는 값

`/g/[token]` 페이지가 DB에서 읽어 복호화한 뒤 화면 컴포넌트에 넘기는 props다. 화면 문구로 바꾸는 일(호전 → "좋아졌어요" 등)은 화면 컴포넌트가 한다.

```ts
type GuardianReportProps = {
  guardianName: string;      // "김○○" → "안녕하세요, 김○○ 보호자님"
  guardianTitle?: string;    // 관계에 따른 호칭. 보호자·사회복지사·담당자·후견인 (D-49)
  clientName: string;        // "홍길순" → "홍길순 어르신 방문 보고서"
  caregiverName: string;     // 맨 아래 "이○○ 요양보호사가 작성하고 확인한 기록이에요"
  startedAt: string;         // ISO 시각 → "10월 6일 (월) 09:00 ~ 12:00 · 3시간"
  endedAt: string;
  record: CareRecord;
};
```

| 화면 | 값 | 보여 주는 규칙 |
| --- | --- | --- |
| 신체활동 도움 | `physical`, `physicalNote` | `true`인 항목만 "✓ 개인위생"처럼, 아래에 "제공시간 60분"(0분도 표시) |
| 인지·정서 지원 | `cognitive` | 네 항목을 항상 "인지자극활동 20분"처럼. `0`은 "0분"(회색). 인지관리는 "인지행동변화 관리", 정서지원은 "의사소통·말벗·격려" |
| 가사·일상생활 지원 | `household` | `true`인 항목만 "✓ 식사준비·청소·세탁"처럼, 아래에 "제공시간 40분"(0분도 표시) |
| 지난 방문과 비교 | `change` | `improved`·`same`·`worse` → "좋아졌어요"·"비슷해요"·"나빠졌어요". `null`인 줄은 숨김 |
| 배변 변화 | `bowel` | `0`은 "없음", 1 이상은 "1번". `null`인 줄은 숨김 |
| 특이사항 | `guardianNotes` (없으면 `notes`) | 그대로. 비어 있으면 카드 숨김 |

- "지난 방문과 비교"는 변화상태(6번) 값을 보여 주는 것이라, 지난 방문 기록을 따로 불러오지 않는다.
- 체크 항목은 한 것만 보여 주고, 시간(분)은 0분도 보여 준다 (D-24 261009.ver). 구조는 서식 원문(별지 제12호, 2025.12.12 개정)과 같다: 신체활동·가사는 체크 + 합계 제공시간, 인지·정서는 항목별 분, 배변 변화는 변화상태 안.
- 보내기 전에 C-15에서 빠진 항목을 확인하므로, G-01에서 `null`은 "요양보호사가 비워 두고 보냄"이다. 그 줄은 표시하지 않는다.

### 정할 것

- 기존 보고서(`meals`·`medication`·`notes`만 있는 것)를 G-01에서 지금 화면 그대로 보여 줄지 (개발 1)
- `Report.careRecord` 한 칸에 통째로 암호화할지, 항목별로 나눌지 (개발 2)
- C-14의 "내가 한 말" 근거를 `aiRawJson`에 항목별로 둘지 (개발 1, C-14 설계 때)

## 진료용 기간 요약 (DIF-4, D-29 확정 10/13)

보험금 청구는 공단 등급 서류·의사 진단서 같은 공적 서류로 하므로, 앱 보고서는 그 근거가 될 수 없다. 대신 병원 진료 때 보호자가 의료진에게 보여 줄 **한 장짜리 기간 요약**으로 만든다. 미국 요양시설의 INTERACT "Stop and Watch"(돌봄 인력이 평소와 달라진 점만 체크해 간호사·의사에게 넘기는 도구)와 같은 역할이다. 양식은 저작권이 있어 구조만 참고한다.

입구는 C-19 **서류 만들기** 하나다. 먼저 서류 종류(진료 참고용 요약 · 급여제공기록지)를 고르면 그 아래에 기간(하루 · 최근 1주 · 최근 1개월 · 직접 고르기, 두 서류 같음)이 나타나고, 둘 다 고르면 "서류 만들기" 버튼이 켜진다. 급여제공기록지용 기간 선택 화면을 따로 만들지 않기 위해서다. 이 절은 진료 참고용 요약의 값만 정한다.

새로 입력하는 값은 없다. 기간 안의 `CareRecord`를 모아 보여 준다. Stop and Watch의 "달라진 점"은 급여제공기록지의 변화상태(신체·식사·인지 호전/유지/악화)와 배변 변화가 이미 맡고 있고, 변화상태는 요양보호사가 직접 골라 "관찰이지 진단이 아니다"라는 원칙과도 맞는다.

### 화면(C-20·G-03)이 받는 값

```ts
type PeriodSummaryProps = {
  clientName: string;
  age: number | null;
  gender: string | null;
  medicationNotes: string | null; // Client.medicationNotes, "복용 중인 약"
  caregiverName: string;
  from: string;                   // ISO 날짜, 기간 시작
  to: string;                     // ISO 날짜, 기간 끝
  createdAt: string;              // 작성일
  createdBy: "caregiver" | "guardian"; // D-26: 보호자도 직접 만듦
  visits: {                       // 기간 안의 보낸(SENT) 보고서, 오래된 순
    startedAt: string;
    endedAt: string;
    record: CareRecord;
  }[];
  periodSummary: string | null;   // 기간 변화 요약 (개발 1 AI). 실패하면 null → 숨김
};
```

| 순서 | 화면 | 값 | 보여 주는 규칙 |
| --- | --- | --- | --- |
| 1 | 기간 중 달라진 점 | `visits[].record.change` | `worse`인 날·항목만 "10월 6일 식사기능 나빠졌어요"처럼. 없으면 "기간 중 나빠진 기록이 없어요" |
| 2 | 변화상태 추이 | `change` | 줄 = 신체기능·식사기능·인지기능, 칸 = 방문 날짜. `null`은 "-" |
| 3 | 배변 변화 | `bowel` | 날짜별 대변·소변 실수 횟수 (0회도 표시). 기저귀 교환은 쓰는 분만 |
| 4 | 특이사항 모음 | `notes` | 날짜 + 문장. 혈압·복약도 여기서 보임. `null`인 날은 뺌 |
| 5 | 기간 요약 | `periodSummary` | AI 문단. 아래에 작성자·작성일과 "요양보호사 관찰 기록이며 의료적 진단이 아닙니다" (LAW-10) |

신체활동·인지정서·가사 체크와 제공시간은 "무엇을 해 드렸나"라서 진료에는 덜 쓰인다. 넣을지는 아래에서 정한다.

### 정할 것

- 서류 만들기의 급여제공기록지는 기관이 발급하는 공식 사본이 아니다. 문서 이름과 고지 문구 (기획)
- DIF-3 기관 서류 탭(C-17)과 서류 만들기의 급여제공기록지 나누기. 제안: 탭은 방문 직후 그날 기록 확인, 서류 만들기는 지난 날짜·여러 날 출력 (기획·개발 1)
- 급여제공기록지 서식이 한 장에 담는 기간 확인 (기획). 결과는 날짜마다 한 장으로 가정
- 혈압·복약은 `notes` 문장에만 있어 추이를 표로 그리기 어렵다. AI가 문장에서 뽑을지, `CareRecord`에 숫자 칸을 둘지 (기획·개발 1)
- Stop and Watch에 있는 수면·통증·낙상·피부(욕창) 칸이 없다. 특이사항으로 둘지, 칸을 더할지 (기획)
- 제공한 돌봄(체크·제공시간) 요약을 맨 뒤에 넣을지 뺄지 (기획)
- 기간 안에 `careRecord`가 없는 옛 보고서가 섞이면 특이사항만 보여 줄지 (개발 1)

## 게시판 (DIF-5, D-15 261101.ver)

대화방 대신 수급자마다 게시판을 둔다. 보낸 방문 보고서 하나가 글 하나이고, 요양보호사와 보호자는 글마다 댓글로 이야기한다. 새 글 모델은 없다: `Visit.status = SENT`인 `Report`가 곧 글이다. D-45의 `Guardian`·`ChatRoom`·`Message` 초안은 쓰지 않는다.

### 저장 모양

```prisma
model Comment {
  id        String   @id @default(cuid())
  reportId  String   // 댓글을 단 글(보낸 보고서)
  author    String   // "caregiver" | "guardian"
  body      String   // 암호화 (LAW-11)
  createdAt DateTime @default(now())
}
```

- 댓글은 보낸 보고서(`reportId`) 또는 게시판에 올린 서류(`documentId`) 중 하나에 단다 (11/1 저녁, 마이그레이션 `20261101180000_shared_documents`).
- `SharedDocument`(clientId, caregiverId, kind="summary", from·to YYYY-MM-DD, shareToken): 진료 참고용 요약(C-20)의 "게시판에 올리기". 내용은 저장하지 않고 볼 때 그 기간 기록으로 다시 만든다. 같은 수급자·기간은 한 번만. 보호자는 `/v1120/g/[shareToken]/post`·`/document`로 본다.
- `Client.boardToken`(11/1, 마이그레이션 `20261101210000_client_board_token`): 보호자 게시판 초대 링크 `/v1120/g/[boardToken]/board`. 초대 화면(C-23)을 처음 열 때 `myBoardToken`이 만든다. 보고서를 보내기 전에도 들어올 수 있다. `guardianBoard`는 보고서·서류·초대 토큰을 모두 받는다.
- 수급자를 완전히 지우거나(`purgeExpiredClients`) 체험 계정을 지울 때 보고서·서류보다 먼저 지운다. FK도 `ON DELETE CASCADE`.
- 마이그레이션: `prisma/migrations/20261101120000_board_comments`.

### 화면이 받는 값

```ts
type BoardComment = { id: string; from: "caregiver" | "guardian"; at: string; text: string };
type BoardPost = { shareToken: string; title: string; at: string; notes: string | null; physicalNote: string | null; comments: BoardComment[] };
```

| 화면 | 받는 값 | 비고 |
| --- | --- | --- |
| 게시판 탭 (`/v1120/chats`) | `myBoardSummary()` | 수급자별 최근 글 제목과 댓글 수 |
| C-18 수급자 게시판 (`/v1120/chats/[clientId]`) | `myBoard(clientId)` 최신 글이 위 | 글 카드 목록. 내 수급자의 보낸 보고서만 |
| C-18 게시글 상세 (`/v1120/chats/[clientId]/[shareToken]`) | `myBoard(clientId)`에서 그 글 | 보고서 요약(`physicalNote`·`notes`) + 댓글, 입력칸은 아래 고정 |
| G-02 보호자 게시판 (`/v1120/g/[shareToken]/board`) | `guardianBoard(shareToken)` | 받은 보고서 링크 하나로 그 수급자의 보낸 보고서를 모두 본다. 로그인 없음 |
| G-02 게시글 상세 (`/v1120/g/[shareToken]/post`) | `guardianBoard(shareToken)`에서 그 글 | C-18 상세와 같은 모양 |

`notes`는 보호자 보고서에 보인 특이사항(`guardianNotes`, 없으면 `notes`)이다. 화면(`app/v1120/_components/Board.tsx`의 `PostCard`·`PostSummary`·`CommentThread`)은 열어 둔 동안 5초마다 `router.refresh()`로 글·댓글을 다시 받는다 (D-34 폴링). 디자인은 Figma wireframe-1120 "와이어 · C-18 수급자 게시판"·"게시글 상세"·"G-02 보호자 게시판".

### 액션 (`app/v1120/_actions.ts`)

| 액션 | 누가 | 확인 |
| --- | --- | --- |
| `commentAsCaregiver(shareToken, text)` | 요양보호사 | 내가 보낸 보고서인지, 수급자가 지워지지 않았는지 |
| `commentAsGuardian(shareToken, text)` | 보호자 | 보낸 보고서인지, 수급자가 활성인지. 링크만 있으면 쓸 수 있음 |

댓글은 1~500자.

### 남은 것

- 안 읽은 댓글 수: 지금은 늘 0 (`_unread.ts`). `Comment`에 읽은 시각을 두고 서버 값으로 바꾼다.
- 보호자 확인: 링크만 있으면 누구나 보호자로 보고 쓴다. 보호자 로그인(D-44)이나 링크 만료(STB-5)로 막는다.

## 방문 상태 전이

```
NOT_STARTED → RECORDING → RECORDED → SUMMARIZING → DRAFT_READY → SENT
                              ↑            │
                              └── 실패 ────┘
```

| 전이 | 일어나는 곳 |
| --- | --- |
| → `RECORDING` | `POST /api/visits` (방문 생성) |
| → `RECORDED` | `POST /api/visits/[id]/stop` (기록 저장) |
| → `SUMMARIZING` → `DRAFT_READY` | `POST /api/visits/[id]/summarize` (실패 시 `RECORDED`로 되돌림) |
| → `SENT` | `POST /api/reports/[id]/send` |

1120 화면은 `app/v1120/_actions.ts`의 서버 액션을 쓴다: `startVisit`(→ `RECORDING`, 오늘 방문이 있으면 이어서) · `saveTranscript`(문장마다, D-27) · `finishRecording`(→ `RECORDED`) · `summarizeVisit`(→ `SUMMARIZING` → `DRAFT_READY`, 실패 시 `RECORDED`. 이미 정리 중이거나 끝났으면 다시 하지 않음) · `saveRecord` · `sendReport`(→ `SENT`). `SENT` 뒤에는 모두 막는다(STB-1). 지금 정리는 AI 대신 `app/v1120/_extract.ts`(낱말·숫자 찾기)가 하고, 녹음 내용은 외부로 나가지 않아 개인정보 필터 없이 암호화만 한다.

**알려진 문제 (옛 화면)**: 이전 상태를 확인하지 않는다. `SENT` 뒤에도 수정·재전송이 되고(STB-1), `SUMMARIZING` 중에 다시 요약할 수 있다(STB-2).

## 추가 예정

| 요구사항 | 변경 |
| --- | --- |
| SEC-2 | `Client.caregiverId`를 필수로 바꾸기 (기존 데이터는 시드 요양보호사로 채움). 칸은 D-35에서 선택 칸으로 추가됨 |
| DIF-3 | 서류 초안 모델 (서식 12호 항목, [../prd/03-legal.md](../prd/03-legal.md)) |
| DIF-5 | `Guardian`·`ChatRoom`·`Message`. 위 "대화방" 절 (D-45 초안) |
| DIF-4 | 새 모델 없음. 기간 내 `Visit`·`Report`를 모아 화면에서 생성 (생성 기록이 필요하면 `ExportLog`). 화면 값은 위 "진료용 기간 요약" 절 (D-29) |
| STB-5 | `Report.shareExpiresAt` |
| LAW-3 | 동의 기록: `Caregiver.consentedAt`·`consentItems`로 넣음 (10/13, D-40) |
