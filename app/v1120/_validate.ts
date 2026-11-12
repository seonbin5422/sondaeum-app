// 입력칸 형식 검사 (11/13 사용자 요청: 대충 쓰거나 틀리면 정확하게 입력해 달라고 알림). 화면(CheckedField)과 서버 액션이 같이 쓴다.
// 반환값: 틀렸으면 안내 문구, 맞거나 비어 있으면 null (비었는지는 필수 검사가 따로 본다)

export type Rule = "name" | "license" | "careNo" | "mobile" | "phone" | "age";

const digits = (v: string) => v.replace(/[\s-]/g, "");

const RULES: Record<Rule, (v: string) => string | null> = {
  // 완성형 한글·영문 2~20자 ('ㄱㄱ'·숫자는 틀림). 보호자 성함 예시 '김○○'처럼 ○는 허용
  name: (v) => (/^[가-힣a-zA-Z○ ]{2,20}$/.test(v) ? null : "이름을 정확하게 적어 주세요 (예: 홍길순)"),
  // 자격증 표기 '제 2019-1234567 호' (발급 연도 4자리-번호 7자리). 제·호·띄어쓰기·하이픈은 있어도 없어도 된다 (사용자 11/13)
  license: (v) =>
    /^(제)?(19|20)\d{2}-?\d{7}(호)?$/.test(v.replace(/\s/g, "")) ? null : "자격증에 적힌 번호를 적어 주세요 (예: 2019-1234567)",
  careNo: (v) => (/^L\d{10}$/i.test(digits(v)) ? null : "장기요양인정번호는 L과 숫자 10자리예요 (예: L1234567890)"),
  mobile: (v) => (/^01[016789]\d{7,8}$/.test(digits(v)) ? null : "휴대폰 번호를 정확하게 적어 주세요 (예: 010-1234-5678)"),
  phone: (v) => (/^0\d{8,10}$/.test(digits(v)) ? null : "전화번호를 정확하게 적어 주세요 (예: 010-1234-5678)"),
  age: (v) => (/^\d{1,3}$/.test(v) && +v >= 1 && +v <= 120 ? null : "나이는 숫자로 적어 주세요 (예: 82)"),
};

export function checkField(rule: Rule, value: string): string | null {
  const v = value.trim();
  return v ? RULES[rule](v) : null;
}

// 서버 액션용: 틀린 칸이 있으면 첫 안내 문구를 던진다 (화면 검사를 건너뛴 요청도 막는다)
export function assertFields(fields: [Rule, FormDataEntryValue | string | null | undefined][]) {
  for (const [rule, v] of fields) {
    const msg = checkField(rule, typeof v === "string" ? v : "");
    if (msg) throw new Error(msg);
  }
}
