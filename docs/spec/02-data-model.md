# 02. 데이터 모델

모델은 4개(`Caregiver`, `Client`, `Visit`, `Report`)다. 원본은 `prisma/schema.prisma`이고, 바꿀 때는 `npx prisma migrate dev --name <이름>`으로 마이그레이션을 만든다.

## 관계

```
Caregiver 1 ── N Visit N ── 1 Client
                 │
                 1
                 │
               Report (0..1)
```

`Client`에는 담당 요양보호사가 없다. 그래서 모든 요양보호사가 모든 수급자를 본다. → SEC-2에서 `Client.caregiverId` 추가

## 모델

### Caregiver (요양보호사)

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `id` | String (cuid) | |
| `name` | String | |
| `licenseNumber` | String? | 요양보호사 자격번호. 처음 설정(C-02)에서 필수로 받는다 (D-31) |
| `kakaoId` | String? unique | 카카오 사용자 ID |

### Client (수급자)

| 필드 | 타입 | 설명 | 암호화 |
| --- | --- | --- | --- |
| `name` | String | 이름 | 아니오 (SEC-5) |
| `age`, `gender` | Int?, String? | | 아니오 |
| `allergies`, `medicalHistory`, `medicationNotes` | String? | 알레르기, 병력, 복용약 | 아니오 (SEC-5) |
| `personalNotes` | String? | 요양보호사의 지속 메모(특이사항) | 아니오 |
| `guardianName`, `guardianRelation` | String | 보호자 이름, 관계(아들·딸·배우자·직접 입력) | 아니오 |
| `careRegistrationNumber` | String? | 장기요양인정번호. 등록·수정(C-07·C-08)에서 필수 (D-31) | 아니오 (SEC-5) |
| `phone` | String? | | 아니오 (SEC-5) |
| `scheduleLabel` | String? | 돌봄 계약시간, 예: `수,금,토 17:00-23:00` (`lib/schedule.ts`가 해석) | 아니오 |
| `isActive` | Boolean | `false` = 삭제됨(복원 가능) | |
| `purgeAt` | DateTime? | 영구 삭제 예정 시각 (요청 후 14일) | |

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
| `aiRawJson` | String? | AI 원본 응답(누락 여부 포함), **암호화** |
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
    minutes: number | null;          // 제공시간 (분)
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
    minutes: number | null;                  // 제공시간 (분)
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

  // 7. 특이사항: 혈압·복약도 여기에
  notes: string | null;
};
```

1번 서비스 시간은 따로 저장하지 않고 `Visit.startedAt`·`endedAt`에서 계산한다.

### 보호자 보고서 화면(G-01)이 받는 값

`/g/[token]` 페이지가 DB에서 읽어 복호화한 뒤 화면 컴포넌트에 넘기는 props다. 화면 문구로 바꾸는 일(호전 → "좋아졌어요" 등)은 화면 컴포넌트가 한다.

```ts
type GuardianReportProps = {
  guardianName: string;      // "김○○" → "안녕하세요, 김○○ 보호자님"
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
| 특이사항 | `notes` | 그대로. 비어 있으면 카드 숨김 |

- "지난 방문과 비교"는 변화상태(6번) 값을 보여 주는 것이라, 지난 방문 기록을 따로 불러오지 않는다.
- 체크 항목은 한 것만 보여 주고, 시간(분)은 0분도 보여 준다 (D-24 261009.ver). 구조는 서식 원문(별지 제12호, 2025.12.12 개정)과 같다: 신체활동·가사는 체크 + 합계 제공시간, 인지·정서는 항목별 분, 배변 변화는 변화상태 안.
- 보내기 전에 C-15에서 빠진 항목을 확인하므로, G-01에서 `null`은 "요양보호사가 비워 두고 보냄"이다. 그 줄은 표시하지 않는다.

### 정할 것

- 기존 보고서(`meals`·`medication`·`notes`만 있는 것)를 G-01에서 지금 화면 그대로 보여 줄지 (개발 1)
- `Report.careRecord` 한 칸에 통째로 암호화할지, 항목별로 나눌지 (개발 2)
- C-14의 "내가 한 말" 근거를 `aiRawJson`에 항목별로 둘지 (개발 1, C-14 설계 때)

## 진료용 기간 요약 (DIF-4, 제안 · D-29 검토 중)

> 팀 확인 전 초안이다. D-29가 확정되면 [../prd/02-requirements.md](../prd/02-requirements.md) DIF-4 상세와 [../prd/04-prd.md](../prd/04-prd.md) 7절의 "내용"을 이 절에 맞춰 고친다.

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

- DIF-4 목적을 "의료기관·보험사 제출용"에서 "진료용 기간 요약"으로 좁히고 이름을 바꿀지 (기획, D-29)
- 서류 만들기의 급여제공기록지는 기관이 발급하는 공식 사본이 아니다. 문서 이름과 고지 문구 (기획)
- DIF-3 기관 서류 탭(C-17)과 서류 만들기의 급여제공기록지 나누기. 제안: 탭은 방문 직후 그날 기록 확인, 서류 만들기는 지난 날짜·여러 날 출력 (기획·개발 1)
- 급여제공기록지 서식이 한 장에 담는 기간 확인 (기획). 결과는 날짜마다 한 장으로 가정
- 혈압·복약은 `notes` 문장에만 있어 추이를 표로 그리기 어렵다. AI가 문장에서 뽑을지, `CareRecord`에 숫자 칸을 둘지 (기획·개발 1)
- Stop and Watch에 있는 수면·통증·낙상·피부(욕창) 칸이 없다. 특이사항으로 둘지, 칸을 더할지 (기획)
- 제공한 돌봄(체크·제공시간) 요약을 맨 뒤에 넣을지 뺄지 (기획)
- 기간 안에 `careRecord`가 없는 옛 보고서가 섞이면 특이사항만 보여 줄지 (개발 1)

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

**알려진 문제**: 이전 상태를 확인하지 않는다. `SENT` 뒤에도 수정·재전송이 되고(STB-1), `SUMMARIZING` 중에 다시 요약할 수 있다(STB-2).

## 추가 예정

| 요구사항 | 변경 |
| --- | --- |
| SEC-2 | `Client.caregiverId` (필수, 기존 데이터는 시드 요양보호사로 채움) |
| DIF-2 | `Report.careRecord` (String, 암호화된 `CareRecord` JSON, 위 "급여제공기록지 기록" 절) |
| DIF-3 | 서류 초안 모델 (서식 12호 항목, [../prd/03-legal.md](../prd/03-legal.md)) |
| DIF-5 | `ChatRoom` (clientId unique, 보호자 입장 토큰, 토큰 만료 시각), `Message` (roomId, 보낸 사람 종류, 내용(암호화), 보고서 카드면 reportId, 읽음 시각) |
| DIF-4 | 새 모델 없음. 기간 내 `Visit`·`Report`를 모아 화면에서 생성 (생성 기록이 필요하면 `ExportLog`). 화면 값은 위 "진료용 기간 요약" 절 (D-29 검토 중) |
| STB-5 | `Report.shareExpiresAt` |
| LAW-4 | `Client.careGrade` 장기요양등급 (`"1등급"`~`"5등급"`, `"인지지원등급"`, D-31) |
| OPS-1 | `Caregiver.isDemo`, `Caregiver.demoExpiresAt` (체험 계정 24시간 뒤 관련 데이터와 함께 삭제) |
| LAW-3 | 동의 기록 (항목별 동의 여부·시각) |
