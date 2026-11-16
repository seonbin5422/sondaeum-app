// 손다음 시연 HTML: 1120 버전 화면을 모두 그대로 쓴다. 서버 대신 브라우저 안의 작은 DB(shims/prisma.ts)가 데이터를 들고,
// 서버 화면(async page)은 여기서 직접 불러 그린다. 주소는 # 뒤에 둔다(file://에서는 경로 이동을 못 함).
import "./shims/fresh-start"; // 맨 먼저: 다른 모듈이 저장된 데이터를 읽기 전에 지운다
import { createRoot } from "react-dom/client";
import { Component, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { currentPath, go, NotFoundSignal, RedirectSignal, setParams } from "./shims/next-navigation";
import { whisper } from "./shims/whisper";
import { routes } from "demo:routes";
import V1120Layout from "@/app/v1120/layout";
import { POST as demoLogin } from "@/app/api/auth/demo/route";
import { POST as onboard } from "@/app/api/caregivers/onboard/route";

type PageFn = (props: { params: Promise<Record<string, string>>; searchParams: Promise<Record<string, string>> }) => ReactNode | Promise<ReactNode>;

// 고정 주소(client/new)를 값 자리 주소(client/[id])보다 먼저 맞춘다 (Next와 같은 순서)
const dyn = (p: string) => (p.match(/\[/g) ?? []).length;
const ROUTES = [...routes].sort((a, b) => dyn(a.path) - dyn(b.path));

function matchRoute(path: string) {
  const segs = path.split("/").filter(Boolean);
  for (const r of ROUTES) {
    const pat = r.path.split("/").filter(Boolean);
    if (pat.length !== segs.length) continue;
    const params: Record<string, string> = {};
    if (pat.every((p, i) => (p.startsWith("[") ? ((params[p.slice(1, -1)] = decodeURIComponent(segs[i])), true) : p === segs[i]))) return { page: r.page as PageFn, params };
  }
  return null;
}

const Missing = () => (
  <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
    <p className="text-xl font-bold">시연 파일에 없는 화면이에요</p>
    <a href="/v1120" className="text-lg font-bold text-(--text-brand)">홈으로</a>
  </div>
);

function handle(e: unknown, show: (n: ReactNode) => void) {
  if (e instanceof RedirectSignal) return go(e.href, true);
  if (e instanceof NotFoundSignal) return show(<Missing />);
  console.error(e);
  show(<p className="p-6 text-base text-(--text-danger)">화면을 그리지 못했어요: {e instanceof Error ? e.message : String(e)}</p>);
}

// 서버 화면(async)은 불러서 기다린 결과를, 그냥 화면은 그대로 그린다
function Page({ path, version }: { path: string; version: number }) {
  const [pathname, query = ""] = path.split("?");
  const m = matchRoute(pathname);
  const isAsync = m?.page.constructor.name === "AsyncFunction";
  const [out, setOut] = useState<ReactNode>(null);
  if (m) setParams(m.params);
  const props = m && { params: Promise.resolve(m.params), searchParams: Promise.resolve(Object.fromEntries(new URLSearchParams(query))) };
  useEffect(() => {
    if (!m || !isAsync) return;
    let live = true;
    Promise.resolve(m.page(props!)).then(
      (el) => live && setOut(el),
      (e) => live && handle(e, setOut),
    );
    return () => void (live = false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 주소·저장이 바뀔 때만 다시 부른다
  }, [path, version]);
  if (!m) return <Missing />;
  if (!isAsync) {
    const P = m.page as (p: object) => ReactNode;
    return <P {...props} />;
  }
  return <>{out}</>;
}

// 화면 안 버튼(서버 동작)이 redirect를 던지면 여기서 받아 옮긴다
class Catch extends Component<{ children: ReactNode; path: string }, { err: unknown }> {
  state = { err: null as unknown };
  static getDerivedStateFromError(err: unknown) {
    return { err };
  }
  componentDidCatch(err: unknown) {
    if (err instanceof RedirectSignal) go(err.href, true);
  }
  componentDidUpdate(prev: { path: string }) {
    if (prev.path !== this.props.path && this.state.err) this.setState({ err: null });
  }
  render() {
    const { err } = this.state;
    if (!err) return this.props.children;
    if (err instanceof RedirectSignal) return null;
    return <p className="p-6 text-base text-(--text-danger)">문제가 생겼어요: {err instanceof Error ? err.message : String(err)}</p>;
  }
}
addEventListener("unhandledrejection", (e) => {
  if (e.reason instanceof RedirectSignal) {
    e.preventDefault();
    go(e.reason.href, true);
  }
});

const subHash = (cb: () => void) => (addEventListener("hashchange", cb), () => removeEventListener("hashchange", cb));
function App() {
  const path = useSyncExternalStore(subHash, currentPath);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    addEventListener("demo-refresh", bump);
    return () => removeEventListener("demo-refresh", bump);
  }, []);
  return (
    <V1120Layout params={Promise.resolve({})}>
      <Catch path={path}>
        <Page key={path} path={path} version={version} />
      </Catch>
    </V1120Layout>
  );
}

// public/ 그림·소리 주소(/v1120/…, /brand/…)를 붙는 순간 파일 안의 data:로 바꾼다 (file://에서는 못 불러옴, build.mjs의 window.__ASSETS)
const ASSETS = (window as unknown as { __ASSETS: Record<string, string> }).__ASSETS;
const fix = (v: unknown) => (typeof v === "string" && ASSETS[v.split("?")[0]]) || v;
const setAttr = Element.prototype.setAttribute;
Element.prototype.setAttribute = function (name: string, value: string) {
  return setAttr.call(this, name, name === "src" || name === "href" ? (fix(value) as string) : value);
};
for (const proto of [HTMLImageElement.prototype, HTMLMediaElement.prototype]) {
  const d = Object.getOwnPropertyDescriptor(proto, "src")!;
  Object.defineProperty(proto, "src", { ...d, set(v: string) { d.set!.call(this, fix(v)); } });
}
const RealAudio = window.Audio;
window.Audio = function (src?: string) { return new RealAudio(fix(src) as string | undefined); } as unknown as typeof Audio;

// 서버 API를 부르는 링크·폼(둘러보기·카카오 로그인·가입 동의)을 파일 안의 같은 코드로 돌린다
async function callRoute(handler: (req: never) => Promise<unknown>, form: FormData | null) {
  const req = { formData: async () => form ?? new FormData(), headers: new Headers({ host: "demo" }), nextUrl: new URL("demo://demo/"), url: "demo://demo/" };
  try {
    const res = (await handler(req as never)) as { body: unknown; status: number; init: { headers?: Record<string, string> } };
    const to = res.init.headers?.location;
    if (to) return go(to);
    if (res.status >= 400) alert((res.body as { error?: string })?.error ?? "처리하지 못했어요.");
  } catch (e) {
    if (e instanceof RedirectSignal) return go(e.href);
    throw e;
  }
}
// 카카오 로그인은 서버의 비밀키·돌아올 주소가 필요해 시연 파일에서는 체험 계정으로 들어간다
const API: Record<string, (form: FormData | null) => Promise<void>> = {
  "/api/auth/demo": (f) => callRoute(demoLogin as never, f),
  "/api/auth/kakao/start": (f) => callRoute(demoLogin as never, f),
  "/api/caregivers/onboard": (f) => callRoute(onboard as never, f),
};
document.addEventListener("click", (e) => {
  const a = (e.target as Element).closest?.("a");
  const href = a?.getAttribute("href");
  if (!href?.startsWith("/") || e.defaultPrevented) return;
  e.preventDefault();
  const api = API[href.split("?")[0]];
  if (api) void api(null);
  else go(href);
});
// React의 onSubmit(칸 채우기 등)이 끝난 뒤에 받도록 window에서 듣는다
addEventListener("submit", (e) => {
  const form = e.target as HTMLFormElement;
  const action = form.getAttribute("action");
  if (e.defaultPrevented || !action?.startsWith("/")) return;
  e.preventDefault();
  const api = API[action.split("?")[0]];
  if (api) void api(new FormData(form, (e as SubmitEvent).submitter));
  else go(action);
});

// "음성 파일 올리기"가 부르는 서버 /transcribe를 Groq Whisper 직접 호출로 바꾼다 (응답 모양 { text } | { error }는 서버와 같다)
const realFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
  if (typeof input === "string" && /\/api\/visits\/[^/]+\/transcribe$/.test(input)) {
    const file = (init?.body as FormData).get("audio") as File;
    try {
      const text = await whisper(file, file.name);
      return Response.json(text ? { text } : { error: "음성에서 내용을 찾지 못했어요. 다시 녹음하거나 직접 입력해주세요." }, { status: text ? 200 : 500 });
    } catch {
      return Response.json({ error: "음성 파일을 처리하지 못했어요. 파일 형식을 확인하거나 다시 시도해주세요." }, { status: 500 });
    }
  }
  return realFetch(input, init);
};

// 화면 이동 신호(RedirectSignal)는 오류가 아니라 콘솔에 남기지 않는다
const quiet = (err: unknown) => void (err instanceof RedirectSignal || console.error(err));
createRoot(document.getElementById("root")!, { onCaughtError: quiet, onRecoverableError: quiet }).render(<App />);
