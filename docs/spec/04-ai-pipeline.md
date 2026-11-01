# 04. AI 파이프라인

요양보호사의 기록은 **개인정보 필터 → 암호화 저장 → AI 요약 → 암호화 저장 → 요양보호사 검토** 순서로 처리된다. AI 호출은 모두 Groq API(해외)로 간다.

## 흐름

```
[기록 화면]
  ├─ 말하기: Web Speech API (브라우저, 실시간 전사)
  ├─ 음성 파일: POST transcribe → Groq whisper-large-v3-turbo (파일 저장 안 함)
  └─ 직접 입력
        ↓ 전사문
POST stop ─→ redactPii() ─→ Groq gpt-oss-20b (개인정보 → "[개인정보 제외]")
        ↓          실패하면 저장 중단 (fail-closed)
      encryptText() → Visit.transcript
        ↓
POST summarize ─→ decrypt → classifyCareNote() → Groq gpt-oss-120b (구조화 출력)
        ↓
      Report: meals / medication / notes / 복약 체크 5종 + aiRawJson(누락 여부) — 모두 암호화
        ↓
[검토 화면] 누락 항목 알림 → 요양보호사 수정 → 전송
```

## 1120 녹음 직후 되묻기 (D-51)

`app/v1120/visit/[id]/record/RecordScreen.tsx`. AI를 부르지 않고 화면 안에서 끝난다.

```
"다 말했어요" → 낱말 찾기(_extract.ts)로 빈 칸 찾기
   ├─ 빈 칸마다 정해 둔 질문 (guide()의 say, 1~6번)
   └─ 특이사항에 문제 낱말이 있는데 그 뒤에 조치·전달 낱말이 없으면 7·8번 질문
        ↓ 질문 글 + public/v1120/ask/{번호}.mp3 재생 (클릭 처리 안에서만, 아이폰)
   요양보호사가 녹음 버튼을 눌러 답 → 녹음 글(Visit.transcript) 끝에 붙음
        ↓ 질문이 끝나거나 "그만 묻고 정리하기"
   finishRecording → 아래 AI 정리로 (답도 같은 전사문이라 따로 처리 없음)
```

- 음성 파일은 Edge 음성(ko-KR-SunHiNeural, 속도 -5%)으로 미리 만든 정적 파일이다. 질문 문장에 개인정보가 없어 밖으로 나가는 데이터가 없다. 문장을 바꾸면 코드 주석의 edge-tts 명령으로 다시 만든다.
- 브라우저 읽기(speechSynthesis)는 아이폰 Safari·크롬에서 "다 읽음"까지 가는데 소리가 나지 않아 쓰지 않는다(11/1 실기기).
- 빈 칸 판단은 낱말 찾기 기준이라 AI라면 찾았을 칸도 물을 수 있다. 놓친 조치 질문은 C-14의 AI 질문(notesAsk)이 다시 잡는다.

## 요약 출력 (`lib/careNoteAi.ts`)

| 필드 | 뜻 |
| --- | --- |
| `meals`, `medication`, `notes` | 보호자에게 보이는 요약 문장. 언급이 없으면 "특이 언급 없음" |
| `mealsMissing`, `medicationMissing`, `notesMissing` | 해당 항목이 없거나 모호함 |
| `healthStatusMissing`, `bloodPressureMissing`, `urinationMissing`, `defecationMissing` | 건강상태·혈압·배뇨·배변 언급 없음 → 검토 화면 알림 |
| `medicationMorning` / `Lunch` / `Evening` / `Bedtime` / `None` | 복약 시점 체크 |

누락 알림 문구는 요양보호사에게만 보이고 보호자 보고서에는 섞이지 않는다.

## 개인정보 필터 (`lib/pii.ts`)

- 지우는 것: 주민등록번호, 전화번호, 계좌·카드번호, 구체적 주소, 어르신·요양보호사 외 제3자 실명, 금액이 나오는 가족 간 금전 분쟁
- 지우지 않는 것: 건강 상태, 식사, 복약, 돌봄 정보
- 주의: 필터 자체가 해외 API 호출이라 필터 전 원문이 해외로 나간다. → LAW-6 (형식이 정해진 정보는 정규식으로 먼저 마스킹)

## 암호화 (`lib/crypto.ts`)

- AES-256-GCM, 키는 `ENCRYPTION_KEY`
- 대상: `Visit.transcript`, `Report.meals`·`medication`·`notes`·`aiRawJson`
- 대상 아님: `Client`의 개인정보 전부 → SEC-5
- 복호화 실패 시 `safeDecryptText()`가 "(복호화 오류)"를 보여줌

## 바꿀 예정

| 요구사항 | 변경 |
| --- | --- |
| STB-2 | `summarize`는 `RECORDED` 상태일 때만 실행 |
| SEC-3 | 세 AI API에 세션 확인과 호출 횟수 제한 |
| LAW-1 | 프롬프트에 "관찰 사실만, 진단·처방 표현 금지" 추가, 출력에 금칙어 검사 |
| LAW-2 | 발화에 없는 항목은 비워 두고 "확인 필요" |
| DIF-2 | 지난 방문 보고서를 함께 넣어 변화 요약 |
| DIF-3 | 서식 12호 항목 추출용 스키마 추가 ([../prd/03-legal.md](../prd/03-legal.md)) |
| DIF-7 | 수급자 프로필을 맥락으로 넣기, 평가 샘플 20~30건과 채점 스크립트 |
| LAW-7 | 학대 의심 표현 분류 → 보호자 보고서에서 제외, 요양보호사에게 신고 안내 |
