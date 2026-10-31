import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { cleanEnv } from "@/lib/env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const keyB64 = cleanEnv(process.env.ENCRYPTION_KEY);
  if (!keyB64) throw new Error("ENCRYPTION_KEY 환경변수가 설정되지 않았습니다.");
  const key = Buffer.from(keyB64, "base64");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY는 base64로 인코딩된 32바이트여야 합니다.");
  }
  return key;
}

export function encryptText(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

export function decryptText(encoded: string): string {
  const buf = Buffer.from(encoded, "base64");
  const iv = buf.subarray(0, IV_LENGTH);
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export function safeDecryptText(encoded: string, fallback = "(복호화 오류)"): string {
  try {
    return decryptText(encoded);
  } catch {
    return fallback;
  }
}

// SEC-5 수급자 이름·전화번호처럼 칸 하나를 암호화해 저장한다. 빈 값은 그대로 둔다
export function sealPII(value: string): string;
export function sealPII(value: string | null): string | null;
export function sealPII(value: string | null): string | null {
  return value ? encryptText(value) : value;
}

// 암호화하기 전에 저장된 값(평문)도 그대로 읽는다. 옛 화면(main)이 쓰는 기존 데이터를 한 번에 바꾸지 않기 위해서
// shortcut: 평문으로 남은 기존 수급자는 수정할 때 암호화된다, 옛 화면을 지우면 한 번에 바꾸는 스크립트를 돌린다
export function openPII(value: string): string;
export function openPII(value: string | null): string | null;
export function openPII(value: string | null): string | null {
  if (!value) return value;
  try {
    return decryptText(value);
  } catch {
    return value;
  }
}
