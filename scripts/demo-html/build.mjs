// 손다음 시연 HTML 만들기: node scripts/demo-html/build.mjs → demo/sondaeum-demo.html (크롬에서 더블클릭으로 연다)
// 1120 버전 화면 전부를 묶는다. DB·로그인·암호화만 shims/로 바꾸고 화면·저장 코드(app/v1120)는 그대로 쓴다
// 운영진 규칙(11/17): 팀 코드·데이터는 모두 이 파일 한 장 안에. 외부는 Groq API·공용 CDN만.
// Groq 키: DEMO_GROQ_API_KEY 환경 변수. 없으면 AI 없이 낱말 찾기(_extract.ts)로 정리한다.
import { build } from "esbuild";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const shim = (f) => path.join(here, "shims", f);
const key = (process.env.DEMO_GROQ_API_KEY ?? "").trim();

// public/ 파일은 file://에서 못 불러온다 → data: 주소로 바꿔 넣는다
const MIME = { svg: "image/svg+xml", png: "image/png", webp: "image/webp", mp3: "audio/mpeg" };
const dataUri = (f) => `data:${MIME[f.split(".").pop()]};base64,${readFileSync(f).toString("base64")}`;
// 그림·소리는 한 표(window.__ASSETS, 주소 → data:)에 넣는다. 화면이 이름으로 주소를 만들어도(아이콘·탭·둘러보기) entry.tsx가 붙는 순간 바꾼다
const walk = (d) => readdirSync(path.join(root, "public", d), { recursive: true }).filter((f) => MIME[String(f).split(".").pop()]).map((f) => `/${d}/${f}`);
const assets = Object.fromEntries([...walk("v1120"), ...walk("brand")].map((u) => [u, dataUri(path.join(root, "public", u))]));

// 코드에 그대로 적힌 주소는 빌드할 때 바로 바꾼다 (CSS mask처럼 붙는 순간 바꾸기가 안 되는 곳 때문)
const inlineAssets = (t) => t.replace(/\/(?:v1120|brand)\/[\w./-]+\.(?:svg|png|webp|mp3)/g, (m) => assets[m] ?? m);

const js = await build({
  entryPoints: [path.join(here, "entry.tsx")],
  bundle: true,
  write: false,
  minify: true,
  format: "iife",
  jsx: "automatic",
  target: "chrome110",
  define: { "process.env.GROQ_API_KEY": JSON.stringify(key), "process.env.NODE_ENV": '"production"', "process.env.NEXT_PUBLIC_KAKAO_JS_KEY": '""' },
  alias: {
    "@": root,
    "groq-sdk": shim("groq-sdk.ts"),
    "next/navigation": shim("next-navigation.ts"),
    "next/link": shim("next-link.tsx"),
    "next/headers": shim("next-headers.ts"),
    "next/server": shim("next-server.ts"),
    "next/cache": shim("next-cache.ts"),
    "next/image": shim("next-image.tsx"),
    "node:assert/strict": shim("assert.ts"),
    "node:crypto": shim("node-crypto.ts"),
    crypto: shim("node-crypto.ts"),
    "server-only": shim("empty.ts"),
  },
  plugins: [
    {
      name: "demo-shims",
      setup(b) {
        // 서버만 있는 것(DB·로그인 쿠키·암호화)은 브라우저용으로 바꾼다. 화면·저장 코드(_data·_actions)는 그대로 쓴다
        const SERVER = { "@/lib/prisma": "prisma.ts", "@/lib/session": "session.ts", "@/lib/crypto": "crypto-lib.ts", "@/lib/env": "env.ts" };
        b.onResolve({ filter: /^@\/lib\/(prisma|session|crypto|env)$/ }, (a) => ({ path: shim(SERVER[a.path]) }));
        // 1120 화면 목록: app/v1120 아래 page.tsx 전부 (주소는 폴더 이름 그대로, [id]는 값 자리)
        b.onResolve({ filter: /^demo:routes$/ }, () => ({ path: "routes", namespace: "demo" }));
        b.onLoad({ filter: /.*/, namespace: "demo" }, () => {
          const pages = readdirSync(path.join(root, "app/v1120"), { recursive: true }).filter((f) => f.endsWith("page.tsx")).sort();
          const lines = pages.map((f, i) => `import P${i} from ${JSON.stringify(path.join(root, "app/v1120", f))};`);
          const list = pages.map((f, i) => `{ path: ${JSON.stringify(("/v1120/" + path.dirname(f)).replace(/\/\.$/, ""))}, page: P${i} }`);
          return { contents: `${lines.join("\n")}\nexport const routes = [${list.join(",")}];`, loader: "js", resolveDir: root };
        });
        // 시연 HTML에는 코치마크·둘러보기 권유를 띄우지 않는다(사용자 11/17: 발표 시간). 배포 앱은 그대로
        b.onLoad({ filter: /_components\/Coach\.tsx$/ }, (a) => {
          const src = readFileSync(a.path, "utf8");
          for (const f of ["export function Coach(", "export function TourOffer("]) if (!src.includes(f)) throw new Error(`Coach.tsx에 ${f}가 없어요: build.mjs를 고쳐 주세요`);
          return {
            loader: "tsx",
            contents: src.replace("export function Coach(", "export const Coach = (_: { id: string; steps: CoachStep[] }) => null;\nfunction CoachOff(").replace("export function TourOffer(", "export const TourOffer = () => null;\nfunction TourOfferOff("),
          };
        });
        // 아이콘은 CSS mask로 주소를 넣어서(붙는 순간 바꾸기가 안 됨) 그림 표에서 바로 꺼낸다
        b.onLoad({ filter: /_components\/Icon\.tsx$/ }, (a) => ({
          loader: "tsx",
          contents: readFileSync(a.path, "utf8").replace("url(/v1120/icons/${name}.svg)", "url(${window.__ASSETS[`/v1120/icons/${name}.svg`]})"),
        }));
      },
    },
  ],
  loader: { ".css": "empty" }, // 화면 CSS는 styles.css로 따로 만든다
  logLevel: "warning",
});

const cssIn = readFileSync(path.join(here, "styles.css"), "utf8");
const css = (await postcss([tailwind({ base: here })]).process(cssIn, { from: path.join(here, "styles.css") })).css;
const font = readFileSync(path.join(root, "node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2")).toString("base64");

const html = `<!doctype html>
<html lang="ko" class="h-full antialiased" style="--font-pretendard:'Pretendard'">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#f4f4f4">
<title>손다음</title>
<style>@font-face{font-family:'Pretendard';src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:45 920;font-display:swap}</style>
<style>${css}</style>
</head>
<body class="flex min-h-full flex-col">
<div id="root" class="flex min-h-full flex-1 flex-col"></div>
<script>window.__ASSETS=${JSON.stringify(assets)}</script>
<script>${inlineAssets(js.outputFiles[0].text).replace(/<\/script/gi, "<\\/script")}</script>
</body>
</html>`;
// DEMO_OUT: 시험용으로 다른 곳에 만들 때 (키가 든 demo/ 파일을 덮지 않게)
const out = process.env.DEMO_OUT ? path.resolve(process.env.DEMO_OUT) : path.join(root, "demo/sondaeum-demo.html");
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`${out} ${(html.length / 1e6).toFixed(1)}MB, Groq 키 ${key ? "넣음" : "없음(낱말 찾기로 정리)"}`);
