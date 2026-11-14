import type { CoachStep } from "./_components/Coach";

const REVIEW_REST: CoachStep[] = [
  { target: "step-0", title: "하나씩 확인하세요", body: "항목을 눌러 펼치고, 틀린 곳은 고친 뒤 \"확인했어요, 다음\"을 누르세요. \"확인 필요\"는 말하지 않은 항목이라 채워 주세요." },
  { target: "tabs", title: "기록지 모양으로 보기", body: "\"급여제공기록지\"를 누르면 기관 서식 모양으로 볼 수 있어요." },
];

// 화면별 코치마크 문구 (사용자 11/14: 60대 사용자 기준으로 핵심 기능을 웬만하면 다 알려 주기).
// 한 번에 하나만, 누를 곳의 이름을 화면 글자 그대로 따옴표로 적는다. target은 화면의 data-coach 값
export const COACH = {
  // 수급자가 아직 없는 홈 (처음 가입). 등록하면 둘러보기(TOUR)로 이어진다
  homeEmpty: [
    { target: "add-client", title: "먼저 어르신을 등록하세요", body: "\"+ 수급자 등록하기\"를 눌러 이름, 방문 일정, 보호자 연락처를 적어요. 등록하면 사용법을 예시 화면으로 보여 드릴게요." },
  ],
  home: [
    { target: "next-visit", title: "오늘 갈 어르신이에요", body: "\"기록하기\"를 누르면 말로 기록을 시작해요. 다녀온 뒤에 눌러도 괜찮아요." },
    { target: "resume", title: "마무리 못 한 기록", body: "녹음하다 멈췄거나 아직 안 보낸 기록이 있으면 여기에 떠요. \"이어서 하기\"를 누르세요." },
    { target: "bell", title: "알림", body: "보호자 댓글처럼 새 소식이 오면 종 위에 숫자가 떠요." },
    { target: "shortcuts", title: "일정과 서류", body: "\"일정 보기\"로 이번 주 방문을 보고, \"서류 만들기\"로 기간을 골라 기록지 PDF를 만들어요." },
    { target: "nav", title: "아래 메뉴", body: "\"수급자\"에서 어르신 정보를, \"게시판\"에서 보호자와 나눈 이야기를 볼 수 있어요." },
  ],
  record: [
    { target: "mic", title: "누르고 말하세요", body: "이 동그란 버튼을 누르고 오늘 한 일을 편하게 말하세요. 다 말하면 한 번 더 눌러 끝내요." },
    { target: "transcript", title: "말한 내용이 글자로 적혀요", body: "말하는 동안 여기에 글자로 적혀요. 사투리나 작은 소리는 틀리게 적힐 수 있어요." },
    { target: "type", title: "틀린 글자는 직접 고쳐요", body: "\"글로 쓰기\"를 누르면 적힌 글을 손으로 고칠 수 있어요. 말하기 어려울 때 글로 적어도 돼요." },
    { target: "upload", title: "녹음 파일 올리기", body: "휴대폰 녹음 앱으로 미리 녹음했다면 \"음성 파일 올리기\"로 올리세요." },
    { target: "sections", title: "기록지 칸이 채워져요", body: "말한 내용에 맞는 칸에 체크가 생겨요. 빠진 칸은 \"다 말했어요\"를 누르면 소리로 다시 여쭤봐요." },
  ],
  // 녹음 화면에서 바로 왔으면 왼쪽 위 ←가 녹음 화면으로, 홈에서 다시 들어왔으면 "더 말하기" 버튼이 녹음 화면으로 간다
  review: [
    { target: "said", title: "내가 한 말", body: "녹음한 글 그대로예요. AI가 정리한 내용과 맞는지 비교해 보세요. 글자가 틀렸으면 왼쪽 위 ← 를 눌러 녹음 화면에서 \"글로 쓰기\"로 고칠 수 있어요." },
    ...REVIEW_REST,
  ],
  reviewResumed: [
    { target: "said", title: "내가 한 말", body: "녹음한 글 그대로예요. AI가 정리한 내용과 맞는지 비교해 보세요." },
    { target: "talk-more", title: "이어서 말하기", body: "빠진 내용이 있거나 글자가 틀렸으면 \"이어서 말하기\"를 누르세요. 녹음 화면에서 더 말하거나 \"글로 쓰기\"로 고칠 수 있어요." },
    ...REVIEW_REST,
  ],
  clients: [
    { target: "client-card", title: "담당 어르신 카드", body: "이름을 누르면 어르신 정보와 보호자 연락처를 보고 고칠 수 있어요." },
    { target: "client-shortcuts", title: "바로 가기", body: "\"방문 기록\"은 지난 기록, \"서류\"는 기록지 PDF, \"게시판\"은 보호자와 나눈 이야기예요." },
    { target: "removed", title: "삭제한 수급자", body: "잘못 지웠어도 14일 안에는 \"되살리기\"로 돌려놓을 수 있어요." },
    { target: "add-client", title: "새 어르신 등록", body: "새로 맡은 어르신은 여기서 등록해요. 등록하면 보호자를 게시판에 초대할 수 있어요." },
  ],
  chats: [
    { target: "room", title: "어르신마다 게시판이 있어요", body: "보낸 방문 보고서가 글로 올라와요. 보호자가 댓글을 달면 어르신 동그라미 위에 빨간 숫자가 떠요. 누르면 들어가요." },
  ],
  board: [
    { target: "post", title: "보고서 글", body: "글을 누르면 보고서 내용과 보호자 댓글을 보고, 댓글로 답할 수 있어요." },
    { target: "sort", title: "순서 바꾸기", body: "최신 글부터 또는 오래된 글부터 볼 수 있어요." },
  ],
  guardianHome: [
    { target: "reports", title: "방문 보고서", body: "요양보호사가 보낸 방문 보고서를 날짜별로 모아 볼 수 있어요." },
    { target: "documents", title: "서류 만들기", body: "기간을 골라 기록지를 PDF로 받을 수 있어요." },
    { target: "nav", title: "궁금한 점은 게시판에", body: "아래 \"게시판\"에서 보고서마다 댓글로 요양보호사에게 물어볼 수 있어요." },
  ],
  guardianBoard: [
    { target: "post", title: "보고서를 눌러 보세요", body: "보고서를 누르면 자세한 내용을 보고, 궁금한 점을 댓글로 남길 수 있어요." },
  ],
} satisfies Record<string, CoachStep[]>;

// 사용법 둘러보기 (사용자 11/14): 처음 가입해 빈 화면이면 짚을 게 없어서, 수급자를 등록한 뒤 체험 계정 예시 화면 캡처로 흐름을 보여 준다.
// ring = 캡처(390×844 화면) 위 강조 칸 [x, y, 폭, 높이]. shortcut: 화면을 바꾸면 캡처를 다시 찍는다 — public/v1120/tour/*.webp
export type TourStep = { img: string; ring: [number, number, number, number]; title: string; body: string; white?: boolean }; // white: 흰 바탕 화면 캡처
export const TOUR: TourStep[] = [
  { img: "home", ring: [12, 190, 366, 240], title: "방문이 끝나면 \"기록하기\"", body: "홈의 \"이번 방문\" 칸에서 \"기록하기\"를 눌러요. 지금 보이는 건 예시 화면이에요." },
  { img: "mic", ring: [143, 724, 104, 104], title: "말로 기록해요", body: "동그란 버튼을 누르고 오늘 한 일을 편하게 말해요. 사투리도 괜찮아요. 다 말하면 한 번 더 눌러요." },
  { img: "type", ring: [12, 386, 187, 72], title: "틀린 글자는 \"글로 쓰기\"로", body: "말한 내용이 위에 글자로 적혀요. 잘못 적힌 곳은 \"글로 쓰기\"를 눌러 직접 고쳐요." },
  { img: "sections", ring: [12, 370, 366, 104], title: "기록지 칸이 채워져요", body: "말한 내용에 맞는 칸에 체크가 생겨요. 다 말했으면 \"다 말했어요\"를 눌러요. 빠진 칸은 소리로 다시 여쭤봐요." },
  { img: "said", ring: [12, 148, 366, 244], title: "AI가 기록지에 맞춰 정리해요", body: "\"내가 한 말\"과 AI가 정리한 칸이 맞는지 비교해 보세요." },
  { img: "step", ring: [12, 296, 366, 268], title: "하나씩 확인하고 고쳐요", body: "항목을 펼쳐 맞으면 \"확인했어요, 다음\", 틀리면 눌러서 고쳐요." },
  { img: "send", white: true, ring: [12, 756, 366, 72], title: "보호자에게 보내요", body: "보호자가 받을 보고서를 확인하고 \"저장하고 공유하기\"를 눌러요. 보낸 뒤에는 고칠 수 없어요." },
  { img: "board", ring: [12, 76, 366, 164], title: "보호자와 게시판으로 이야기해요", body: "보낸 보고서가 게시판에 올라와요. 보호자가 댓글을 달면 빨간 숫자가 떠요." },
  { img: "home", ring: [12, 426, 366, 166], title: "일정과 서류", body: "\"일정 보기\"로 이번 주 방문을, \"서류 만들기\"로 기간을 골라 기록지 PDF를 만들어요." },
];
