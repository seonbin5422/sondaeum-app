// AI(Groq, 미국)로 보내기 전에 앱 안에서 개인정보를 지운다 (LAW-6, 동의 문구 "이름·전화번호는 먼저 지워요").
// 원문이 밖으로 나가지 않도록 AI를 쓰지 않고 이름(DB 값)과 번호 모양만 바꾼다.
// shortcut: DB에 없는 제3자 이름·말로 한 주소·한글로 읽은 번호("공일공…")는 못 지운다, LAW-6(개발 2)에서 보완

export type KnownPeople = {
  client: string;
  guardian?: string | null;
  caregiver?: string | null;
  phones?: (string | null | undefined)[];
};

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// "홍길순"이면 "홍길순"과 "길순"을 같이 바꾼다 (성 빼고 부르는 경우)
function nameForms(name: string) {
  const n = name.replace(/\s+/g, "");
  return n.length === 3 ? [n, n.slice(1)] : [n];
}

const NUMBER_RULES: [RegExp, string][] = [
  [/\d{6}\s?-?\s?[1-8]\d{6}/g, "[주민번호]"],
  [/\d{4}[-\s]\d{4}[-\s]\d{4}[-\s]\d{4}/g, "[카드번호]"],
  [/01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}/g, "[전화번호]"],
  [/0\d{1,2}[-\s.)]\d{3,4}[-\s.]\d{4}/g, "[전화번호]"],
  // 계좌처럼 하이픈으로 이은 긴 번호. 날짜(2026-10-13)·혈압(135/85)은 숫자 합이 짧아 남는다
  [/\d{2,6}(?:-\d{2,8}){2,3}/g, "[번호]"],
  [/\d{10,}/g, "[번호]"],
];

export function redactForAi(text: string, people: KnownPeople) {
  let out = text;
  const names: [string, string][] = [
    ...nameForms(people.client).map((n): [string, string] => [n, "수급자"]),
    ...(people.guardian ? nameForms(people.guardian).map((n): [string, string] => [n, "보호자"]) : []),
    ...(people.caregiver ? nameForms(people.caregiver).map((n): [string, string] => [n, "요양보호사"]) : []),
  ]
    .filter(([n]) => n.length >= 2)
    .sort((a, b) => b[0].length - a[0].length); // 긴 이름 먼저 ("홍길순" 다음 "길순")
  for (const [n, role] of names) out = out.replace(new RegExp(escape(n), "g"), role);
  for (const p of people.phones ?? []) {
    const digits = p?.replace(/\D/g, "");
    if (digits && digits.length >= 8) out = out.replace(new RegExp(digits.split("").join("[-\\s.]?"), "g"), "[전화번호]");
  }
  for (const [re, label] of NUMBER_RULES) out = out.replace(re, (m) => (label !== "[번호]" || m.replace(/\D/g, "").length >= 10 ? label : m));
  return out;
}
