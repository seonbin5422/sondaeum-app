// 시연 HTML용 lib/crypto: 이 브라우저 안에만 있는 데이터라 암호화하지 않는다(배포 앱은 AES로 암호화). 함수 모양은 원래와 같다
export const encryptText = (t: string) => t;
export const decryptText = (t: string) => t;
export const safeDecryptText = (t: string, _fallback = "(복호화 오류)") => t;
export function sealPII(value: string): string;
export function sealPII(value: string | null): string | null;
export function sealPII(value: string | null) {
  return value;
}
export function openPII(value: string): string;
export function openPII(value: string | null): string | null;
export function openPII(value: string | null) {
  return value;
}
