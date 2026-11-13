import type { CoachStep } from "./_components/Coach";

const REVIEW_REST: CoachStep[] = [
  { target: "step-0", title: "하나씩 확인하세요", body: "항목을 눌러 펼치고, 틀린 곳은 고친 뒤 \"확인했어요, 다음\"을 누르세요. \"확인 필요\"는 말하지 않은 항목이라 채워 주세요." },
  { target: "tabs", title: "기록지 모양으로 보기", body: "\"급여제공기록지\"를 누르면 기관 서식 모양으로 볼 수 있어요." },
];

// 화면별 코치마크 문구 (사용자 11/14: 60대 사용자 기준으로 핵심 기능을 웬만하면 다 알려 주기).
// 한 번에 하나만, 누를 곳의 이름을 화면 글자 그대로 따옴표로 적는다. target은 화면의 data-coach 값
export const COACH = {
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
    { target: "talk-more", title: "빠진 내용 더 말하기", body: "빠진 내용이 있거나 글자가 틀렸으면 이 버튼을 누르세요. 녹음 화면에서 더 말하거나 \"글로 쓰기\"로 고칠 수 있어요." },
    ...REVIEW_REST,
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
