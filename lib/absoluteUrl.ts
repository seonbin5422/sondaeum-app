import { NextRequest } from "next/server";

/**
 * `--experimental-https`로 실행할 때 Next.js dev 서버는 내부적으로 `req.url`의 호스트를
 * 항상 "localhost"로 보고한다(실제로는 LAN IP 등 다른 호스트로 접속했더라도). 그래서
 * `new URL(path, req.url)`로 리다이렉트를 만들면 휴대폰 같은 외부 기기에서는 "localhost"로
 * 리다이렉트되어 연결이 끊긴다. 실제 접속에 쓰인 Host 헤더를 기준으로 절대 URL을 만든다.
 */
export function absoluteUrl(path: string, req: NextRequest): URL {
  const host = req.headers.get("host") ?? req.nextUrl.host;
  const protocol = req.nextUrl.protocol;
  return new URL(path, `${protocol}//${host}`);
}
