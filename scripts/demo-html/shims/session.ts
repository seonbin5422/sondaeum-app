// 시연 HTML용 lib/session: 로그인한 요양보호사 id를 이 브라우저(localStorage)에 둔다 (쿠키·서명 없음)
const KEY = "sondaeum-demo-session";
export async function createSession(caregiverId: string) {
  try {
    localStorage.setItem(KEY, caregiverId);
  } catch {}
}
export async function getSessionCaregiverId(): Promise<string | null> {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
export async function deleteSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
