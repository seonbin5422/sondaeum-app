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
| `licenseNumber` | String? | 요양보호사 자격번호 |
| `kakaoId` | String? unique | 카카오 사용자 ID |

### Client (수급자)

| 필드 | 타입 | 설명 | 암호화 |
| --- | --- | --- | --- |
| `name` | String | 이름 | 아니오 (SEC-5) |
| `age`, `gender` | Int?, String? | | 아니오 |
| `allergies`, `medicalHistory`, `medicationNotes` | String? | 알레르기, 병력, 복용약 | 아니오 (SEC-5) |
| `personalNotes` | String? | 요양보호사의 지속 메모(특이사항) | 아니오 |
| `guardianName`, `guardianRelation` | String | 보호자 이름, 관계(아들·딸·배우자·직접 입력) | 아니오 |
| `careRegistrationNumber` | String? | 장기요양인정번호 | 아니오 (SEC-5) |
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

```ts
type Change = "improved" | "same" | "worse"; // 호전 / 유지 / 악화

type CareRecord = {
  // 2. 신체활동지원 (체크)
  physical: {
    personalHygiene: boolean | null; // 개인위생
    bathing: boolean | null;         // 몸씻기
    mealAssist: boolean | null;      // 식사도움 (식사량은 physicalNote에)
    repositioning: boolean | null;   // 체위변경
    mobility: boolean | null;        // 이동도움
    toileting: boolean | null;       // 화장실이용
  };
  physicalNote: string | null;       // 한 일을 한두 문장으로 (G-01 신체활동 카드 아래 문장)

  // 3. 인지·정서 지원 (분)
  cognitive: {
    stimulation: number | null;      // 인지자극활동
    dailyLiving: number | null;      // 일상생활 함께하기
    management: number | null;       // 인지관리지원
    emotional: number | null;        // 정서지원 (말벗·격려)
  };

  // 4. 가사·일상생활지원 (분)
  household: {
    mealPrepCleaningLaundry: number | null; // 식사준비·청소·세탁
    outingEscort: number | null;            // 외출동행
  };

  // 5. 배설 (횟수)
  excretion: {
    stoolAccidents: number | null;   // 대변 실수
    urineAccidents: number | null;   // 소변 실수
    diaperChanges: number | null;    // 기저귀 교환 (기저귀를 쓰는 분만)
  };

  // 6. 변화상태: 요양보호사가 직접 고름, AI는 채우지 않음
  change: {
    physical: Change | null;         // 신체기능
    meal: Change | null;             // 식사기능
    cognitive: Change | null;        // 인지기능
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
| 신체활동 도움 | `physical`, `physicalNote` | `true`인 항목만 "✓ 개인위생"처럼. 하나도 없으면 카드 숨김 |
| 인지·정서 지원 | `cognitive` | 1분 이상인 항목만 "인지자극활동 20분". 정서지원은 "말벗·격려"로 표시 |
| 가사·일상생활 지원 | `household` | 1분 이상인 항목만 |
| 배설 | `excretion` | `0`은 "없음", 1 이상은 "1번". `null`인 줄은 숨김 |
| 지난 방문과 비교 | `change` | `improved`·`same`·`worse` → "좋아졌어요"·"비슷해요"·"나빠졌어요". `null`인 줄은 숨김 |
| 특이사항 | `notes` | 그대로. 비어 있으면 카드 숨김 |

- "지난 방문과 비교"는 변화상태(6번) 값을 보여 주는 것이라, 지난 방문 기록을 따로 불러오지 않는다.
- 보내기 전에 C-15에서 빠진 항목을 확인하므로, G-01에서 `null`은 "요양보호사가 비워 두고 보냄"이다. 화면에는 표시하지 않는다.

### 정할 것

- 기존 보고서(`meals`·`medication`·`notes`만 있는 것)를 G-01에서 지금 화면 그대로 보여 줄지 (개발 1)
- `Report.careRecord` 한 칸에 통째로 암호화할지, 항목별로 나눌지 (개발 2)
- C-14의 "내가 한 말" 근거를 `aiRawJson`에 항목별로 둘지 (개발 1, C-14 설계 때)

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
| DIF-4 | 새 모델 없음. 기간 내 `Visit`·`Report`를 모아 화면에서 생성 (생성 기록이 필요하면 `ExportLog`) |
| STB-5 | `Report.shareExpiresAt` |
| LAW-4 | `Client`에 장기요양등급 |
| OPS-1 | `Caregiver.isDemo`, `Caregiver.demoExpiresAt` (체험 계정 24시간 뒤 관련 데이터와 함께 삭제) |
| LAW-3 | 동의 기록 (항목별 동의 여부·시각) |
