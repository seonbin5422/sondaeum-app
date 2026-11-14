# 02. 화면 목록

앱의 모든 화면과 코드 경로, Figma 프레임을 한곳에 연결한다. `Figma 프레임` 칸은 [04-figma-workflow.md](04-figma-workflow.md)의 순서대로 연결하면서 채운다.

## 요양보호사 화면

| # | 화면 | 경로 | 코드 | 관련 요구사항 | Figma 프레임 |
| --- | --- | --- | --- | --- | --- |
| C-01 | 로그인 (카카오 + 체험하기) | `/login` | `app/login/page.tsx` | SEC-4, OPS-1 | [Figma](https://www.figma.com/design/OFZIKhGWAAxCUoL9dNtgJb/?node-id=263-368) |
| C-21 | **동의** (신규, 처음 한 번) | `/onboarding` 안 | 신규 | LAW-3 | |
| C-22 | **수급자 이력** (신규) | `/client/[id]/history` (안) | 신규 | DIF-9 | |
| C-02 | 온보딩 (이름·자격번호) | `/onboarding` | `app/onboarding/page.tsx` | | |
| C-03 | 홈: 오늘의 돌봄 | `/` | `app/page.tsx`, `HomeSchedule`, `ClientCard` | DIF-1, DIF-5(새 메시지 표시) | [Figma](https://www.figma.com/design/OFZIKhGWAAxCUoL9dNtgJb/?node-id=263-397) |
| C-04 | 일정 캘린더 (모달) | `/` 위 모달 | `ScheduleCalendarModal` | DIF-1 | [와이어](https://www.figma.com/design/OFZIKhGWAAxCUoL9dNtgJb/?node-id=278-2) |
| C-05 | 수급자 프로필 카드 (모달) | `/` 위 모달 | `ClientProfileModal` | | |
| C-06 | 요양보호사 프로필 (모달) | `/` 위 모달 | `CaregiverProfileModal` | | |
| C-07 | 수급자 등록 | `/client/new` | `app/client/new/page.tsx` | SEC-2 | |
| C-08 | 수급자 수정 | `/client/[id]/edit` | `app/client/[id]/edit/page.tsx` | | |
| C-09 | 수급자 관리 (목록·복원) | `/clients/manage` | `app/clients/manage/page.tsx`, `ClientManageRow` | | |
| C-10 | 수급자 삭제 확인 | `/client/[id]/delete-confirm` | `app/client/[id]/delete-confirm/page.tsx` | | |
| C-11 | 수급자 영구 삭제 확인 | `/client/[id]/permanent-delete-confirm` | `app/client/[id]/permanent-delete-confirm/page.tsx` | | |
| C-12 | 기록 (음성·텍스트·파일) | `/visit/[id]/record` | `RecordScreen.tsx` | STB-3, STB-4, DIF-6 | [시안](https://www.figma.com/design/OFZIKhGWAAxCUoL9dNtgJb/?node-id=263-465) · [와이어](https://www.figma.com/design/OFZIKhGWAAxCUoL9dNtgJb/?node-id=263-86) · [와이어: 녹음 중](https://www.figma.com/design/OFZIKhGWAAxCUoL9dNtgJb/?node-id=275-2) |
| C-13 | AI 처리중 | `/visit/[id]/processing` | `ProcessingScreen.tsx` | STB-2 | |
| C-14 | 요양노트 검토 | `/visit/[id]/review` | `ReviewForm.tsx`, `ReportSection` | STB-1, DIF-2, DIF-3 | [Figma](https://www.figma.com/design/OFZIKhGWAAxCUoL9dNtgJb/?node-id=263-171) · [하나씩 확인 (D-41)](https://www.figma.com/design/OFZIKhGWAAxCUoL9dNtgJb/?node-id=376-2) | · [다시 들어옴·더 말하기 (D-42)](https://www.figma.com/design/OFZIKhGWAAxCUoL9dNtgJb/?node-id=378-2) · [특이사항 조치 빠짐 (D-43)](https://www.figma.com/design/OFZIKhGWAAxCUoL9dNtgJb/?node-id=378-142)
| C-15 | 전송 확인 | `/visit/[id]/confirm` | `app/visit/[id]/confirm/page.tsx` | STB-1 | [Figma](https://www.figma.com/design/OFZIKhGWAAxCUoL9dNtgJb/?node-id=263-308) |
| C-16 | 공유하기 (링크·카카오톡) | `/visit/[id]/sent` | `SentActions`, `CopyLinkButton`, `ShareLinkButton` | DIF-5 | [Figma](https://www.figma.com/design/OFZIKhGWAAxCUoL9dNtgJb/?node-id=263-334) |
| C-17 | **기관 서류 초안** (신규) | `/visit/[id]/review` 안 탭 | 신규 | DIF-3, LAW-4, LAW-9 | |
| C-18 | **수급자 게시판** (11/1 대화방에서 바꿈, D-15 261101.ver) | `/chats/[clientId]` · 글 `/chats/[clientId]/[post]` | `app/v1120/chats/[clientId]/`, `Board.tsx` | DIF-5 | |
| C-23 | **보호자 게시판 초대** (D-33, D-15 261101.ver) | `/client/[id]/invite` | `app/v1120/client/[id]/invite/page.tsx` | DIF-5 | 와이어 없음 (1120.ver 코드 기준) |
| C-19 | **서류 만들기: 서류 종류·기간 선택** (D-29, 세 번째 서류 상태변화기록지 D-61) | `/client/[id]/documents` | `DocumentPicker.tsx` | DIF-4 |[1 처음](https://www.figma.com/design/OFZIKhGWAAxCUoL9dNtgJb/?node-id=308-57) · [2 서류 고름](https://www.figma.com/design/OFZIKhGWAAxCUoL9dNtgJb/?node-id=308-2) · [3 다 고름](https://www.figma.com/design/OFZIKhGWAAxCUoL9dNtgJb/?node-id=307-2) |
| C-20 | **서류: 건강 기록 요약 A4 화면** (D-29, 이름 바꿈 D-63) | `/client/[id]/documents/summary` | `DocumentViews.tsx` | DIF-4, LAW-10 |[Figma](https://www.figma.com/design/OFZIKhGWAAxCUoL9dNtgJb/?node-id=305-38) |

## 보호자 화면

| # | 화면 | 경로 | 코드 | 관련 요구사항 | Figma 프레임 |
| --- | --- | --- | --- | --- | --- |
| G-01 | 방문 보고서 | `/g/[token]` | `app/g/[token]/page.tsx` | STB-5, DIF-2 | [Figma](https://www.figma.com/design/OFZIKhGWAAxCUoL9dNtgJb/?node-id=263-692) |
| G-02 | **어르신 게시판** (보호자, 로그인 없이 링크로. D-15 261101.ver, C-18과 같은 모양 D-65) | `/g/[token]/board` · 글 `/g/[token]/post` (보호자 앱 예시 `/c/[token]/chat`, P2) | `app/v1120/g/[token]/board/`, `Board.tsx` | DIF-5, LAW-11 | |
| G-03 | **서류 만들기·저장·인쇄** (신규, P2 · DIF-12) | C-19·C-20과 같은 화면, 보호자 홈에서 열기 (D-44, 보호자도 서류 종류·기간 선택, D-26·D-29) | 신규 | DIF-4 | |
| G-04 | **보호자 홈** (D-44, P2 · DIF-12, 임시 데이터 프로토타입) | `/c/[token]` — 방문 일정, 어르신 정보 보기, 보고서 모아보기, 서류 만들기 | `app/v1120/c/[token]/page.tsx` (`_mock.ts`) | DIF-4, DIF-5 | |
| G-05 | **보호자 내 정보** (신규, D-44, P2 · DIF-12) | `/c/[token]/me` — 이름·관계·연락처, 개인정보 처리방침 | 신규 | DIF-5, LAW-12 | |

## 1120.ver 구현 (D-30)

와이어프레임 기준 새 화면은 `app/v1120/` 아래에 있다 (브랜치 `feature/v1120`, 임시 데이터). 주소는 위 표의 경로 앞에 `/v1120`을 붙인다 (예: `/v1120/visit/[id]/review`). 코드 화면 캡처는 Figma [1120.ver 구현](https://www.figma.com/design/OFZIKhGWAAxCUoL9dNtgJb/?node-id=317-2) 페이지에 있다.

- 하단 메뉴바(D-32): 홈 `/v1120` · 수급자 `/v1120/clients` · 게시판 `/v1120/chats` · 내 정보 `/v1120/me`
- 서류 만들기 수급자 고르기 `/v1120/documents` (11/6): 홈 "서류 만들기"에서 수급자가 여럿일 때 "누구의 서류를 만들까요?" → C-19. 한 명이면 바로 C-19
- 홈 "이어서 하기" 시트 (11/6): 마무리 못 한 기록이 2건 이상이면 "어느 기록부터 마무리할까요?" 바텀시트 (`ResumeSheet`)
- 보호자 링크 기한 지남 화면 (11/6, D-53): `/v1120/g/[token]/board`·`post`·`document`에서 "링크 기간이 지났어요" (`BoardExpired`)
- 보호자 하단 메뉴바(D-44, P2 예시): 홈 `/v1120/c/[token]` · 게시판 `/v1120/c/[token]/chat` · 내 정보 `/v1120/c/[token]/me`
- 서류 · 상태변화기록지 결과 `/v1120/client/[id]/documents/status-change` (D-61). 기록 확인(C-14)에도 "상태변화기록지" 탭이 있다 (탭 3개: 기록 확인 · 급여제공기록지 · 상태변화기록지)
- 사용법 둘러보기 `/v1120/tour` (D-57 261114.ver): 수급자를 처음 등록한 뒤 홈에서 "사용법을 둘러볼까요?", 내 정보 "사용법 다시 보기". 예시 화면 캡처 9단계
- 코치마크(D-57): 홈·녹음·기록 확인·수급자·게시판(목록·글)·보호자 홈·보호자 게시판을 처음 열 때. 문구는 `app/v1120/_coachSteps.ts`
- 스낵바(D-58): 수급자 삭제·되살리기·완전히 지우기 뒤 수급자 탭 아래 "~했어요"와 "되돌리기" 10초
- 표에 없던 화면: 게시판 탭 목록(`/v1120/chats`), 보고서 모아보기(보호자 `/v1120/c/[token]/reports`, 보호자 홈에서 열기), 내 정보 탭(C-06 대신), 개인정보 처리방침(`/v1120/privacy`, LAW-12), 서류 · 급여제공기록지 결과(`/v1120/client/[id]/documents/care-sheet`)
- C-05 수급자 정보는 모달이 아니라 수급자 탭의 화면(`/v1120/client/[id]`), C-09는 수급자 탭에 합침
- 요양보호사 화면 호칭은 "수급자", 보호자 화면은 "어르신" (D-31)
- 접근성 버전 와이어: Figma wireframe-1120 페이지의 ["접근성 버전 (WCAG 2.1 AA)" 줄](https://www.figma.com/design/OFZIKhGWAAxCUoL9dNtgJb/?node-id=359-942)과 [기준·색 대비표](https://www.figma.com/design/OFZIKhGWAAxCUoL9dNtgJb/?node-id=361-4). 색은 브랜드 귤색 `#ffb133`을 유지하되 다시 검토 예정 (10/9)

## 화면 흐름

```
처음:   C-01 로그인/체험하기 → C-02 온보딩 → C-21 동의 → C-03 홈("+ 수급자 등록하기" 코치마크) → C-07 등록 → 홈 "사용법을 둘러볼까요?" → 둘러보기 (D-57)

① 방문 기록:  C-03 → C-12 기록 → C-13 AI 처리중 → C-14 검토 (탭: 급여제공기록지·상태변화기록지) → C-15 보낼 내용 보기(요양보호사 서명) → C-16 공유

② 게시판:     C-03 (새 댓글 수) → 게시판 탭 → C-18 수급자 게시판 → 글(보고서·건강 기록 요약) → 댓글
               C-16 보낸 보고서 ─ 카카오톡 공유 카드 ─→ G-01 보고서 → "게시판으로 이동하기" → G-02 어르신 게시판 → 글 → 댓글
               C-23 초대 링크 ───────────────────────→ G-02 어르신 게시판 (보고서를 보내기 전에도)
               요양보호사가 G-01을 "보호자가 보는 화면"으로 열면 "게시판으로 이동하기"는 C-18로 (D-65)

③ 서류 만들기: C-03 또는 C-05 수급자 → C-19 서류 만들기(건강 기록 요약·급여제공기록지·상태변화기록지, 기간) → A4 화면 → PDF 저장·인쇄
                                                          └→ 건강 기록 요약만 "게시판에 올리기" → G-02 글 → 보호자 PDF 저장·인쇄
   보호자 (P2 예시): G-04 보호자 홈 → G-03 서류 만들기 → A4 화면 → PDF 저장·인쇄

관리:   C-03 → C-07 등록 / C-08 수정 → C-09 관리 → C-10 삭제 → C-11 영구 삭제
```
