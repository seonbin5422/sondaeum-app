// 시연 HTML용 node:crypto: 쓰는 것만 (randomUUID, 서명 기기 표시용 createHash)
export const randomUUID = () => crypto.randomUUID();
export const randomBytes = (n: number) => {
  const a = crypto.getRandomValues(new Uint8Array(n));
  return { toString: () => [...a].map((b) => b.toString(16).padStart(2, "0")).join("") };
};
// shortcut: 진짜 해시가 아니다(서명한 기기 접속 주소를 바꿔 적는 데만 쓰임, 시연 HTML에는 접속 주소가 없다)
export const createHash = () => ({ update: () => ({ digest: () => "demo-hash-0000000" }) });
export default { randomUUID, randomBytes, createHash };
