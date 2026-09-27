import "server-only";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cleanEnv } from "@/lib/env";

function getEncodedKey(): Uint8Array {
  const secretKey = cleanEnv(process.env.SESSION_SECRET);
  if (!secretKey) throw new Error("SESSION_SECRET 환경변수가 설정되지 않았습니다.");
  return new TextEncoder().encode(secretKey);
}

export async function signPayload(payload: JWTPayload, expiresIn: string): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getEncodedKey());
}

export async function verifyPayload(token: string | undefined): Promise<JWTPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getEncodedKey(), { algorithms: ["HS256"] });
    return payload;
  } catch {
    return null;
  }
}
