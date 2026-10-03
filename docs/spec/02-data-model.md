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
| `meals`, `medication`, `notes` | String | 식사·복약·특이사항, **암호화** |
| `medicationMorning` / `Lunch` / `Evening` / `Bedtime` / `None` | Boolean | 복약 체크박스 |
| `aiRawJson` | String? | AI 원본 응답(누락 여부 포함), **암호화** |
| `wasEdited` | Boolean | 요양보호사가 수정했는지 |
| `shareToken` | String unique | 보호자 링크 `/g/[token]` |
| `sentAt`, `viewedAt`, `viewCount` | | 전송·첫 열람 시각, 열람 횟수 |

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
| DIF-3 | 서류 초안 모델 (서식 12호 항목, [../prd/03-legal.md](../prd/03-legal.md)) |
| DIF-5 | `ChatRoom` (clientId unique, 보호자 입장 토큰, 토큰 만료 시각), `Message` (roomId, 보낸 사람 종류, 내용(암호화), 보고서 카드면 reportId, 읽음 시각) |
| DIF-4 | 새 모델 없음. 기간 내 `Visit`·`Report`를 모아 화면에서 생성 (생성 기록이 필요하면 `ExportLog`) |
| STB-5 | `Report.shareExpiresAt` |
| LAW-4 | `Client`에 장기요양등급 |
| OPS-1 | `Caregiver.isDemo`, `Caregiver.demoExpiresAt` (체험 계정 24시간 뒤 관련 데이터와 함께 삭제) |
| LAW-3 | 동의 기록 (항목별 동의 여부·시각) |
