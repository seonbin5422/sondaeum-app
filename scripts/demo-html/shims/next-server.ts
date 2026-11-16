// 시연 HTML용 next/server: API 라우트(둘러보기·동의)를 브라우저에서 부를 때 쓰는 최소한
export class NextResponse {
  constructor(public body: unknown, public init: { status?: number; headers?: Record<string, string> } = {}) {}
  get status() {
    return this.init.status ?? 200;
  }
  static redirect(url: URL | string, status = 307) {
    const u = typeof url === "string" ? new URL(url, "demo://demo") : url;
    return new NextResponse(null, { status, headers: { location: u.pathname + u.search } });
  }
  static json(body: unknown, init: { status?: number } = {}) {
    return new NextResponse(body, init);
  }
}
export type NextRequest = Request & { nextUrl: URL };
