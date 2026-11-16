// 손다음 시연 HTML 만들기: node scripts/demo-html/build.mjs → demo/sondaeum-demo.html (크롬에서 더블클릭으로 연다)
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
const iconDir = path.join(root, "public/v1120/icons");
const icons = Object.fromEntries(readdirSync(iconDir).filter((f) => f.endsWith(".svg")).map((f) => [f.slice(0, -4), dataUri(path.join(iconDir, f))]));
const askDir = path.join(root, "public/v1120/ask");
const ask = Object.fromEntries(readdirSync(askDir).filter((f) => f.endsWith(".mp3")).map((f) => [f.slice(0, -4), dataUri(path.join(askDir, f))]));
const inlineAssets = (t) => t.replace(/\/(?:v1120|brand)\/[\w./-]+\.(?:svg|png|webp|mp3)/g, (m) => (existsSync(path.join(root, "public", m)) ? dataUri(path.join(root, "public", m)) : m));

const js = await build({
  entryPoints: [path.join(here, "entry.tsx")],
  bundle: true,
  write: false,
  minify: true,
  format: "iife",
  jsx: "automatic",
  target: "chrome110",
  define: { "process.env.GROQ_API_KEY": JSON.stringify(key), "process.env.NODE_ENV": '"production"', "process.env.NEXT_PUBLIC_KAKAO_JS_KEY": '""' },
  alias: { "@": root, "groq-sdk": shim("groq-sdk.ts"), "next/navigation": shim("next-navigation.ts"), "next/link": shim("next-link.tsx"), "node:assert/strict": shim("assert.ts"), "server-only": shim("env.ts") },
  plugins: [
    {
      name: "demo-shims",
      setup(b) {
        b.onResolve({ filter: /\/_actions$/ }, () => ({ path: shim("actions.ts") }));
        b.onResolve({ filter: /^@\/lib\/env$/ }, () => ({ path: shim("env.ts") }));
        // 화면은 시연용 useSpeech를 쓴다. 시연용 useSpeech가 부르는 원래 훅(브라우저 받아쓰기)은 그대로 둔다
        b.onResolve({ filter: /\/useSpeech$/ }, (a) => (a.importer.endsWith(path.join("shims", "useSpeech.ts")) ? undefined : { path: shim("useSpeech.ts") }));
        // 빠진 항목 질문 소리(1~6.mp3)는 번호로 주소를 만든다 → 파일 안에 넣은 소리 표(ASK)에서 꺼낸다
        b.onLoad({ filter: /record\/RecordScreen\.tsx$/ }, (a) => {
          const src = readFileSync(a.path, "utf8");
          const from = "audio: `/v1120/ask/${i + 1}.mp3`";
          if (!src.includes(from)) throw new Error("RecordScreen 질문 소리 코드가 바뀌었어요: build.mjs를 고쳐 주세요");
          return { loader: "tsx", contents: `const ASK = ${JSON.stringify(ask)};\n` + src.replace(from, "audio: ASK[i + 1]") };
        });
        // 아이콘은 이름으로 주소를 만든다 → 파일 안에 넣은 아이콘 표(ICONS)에서 꺼낸다
        b.onLoad({ filter: /_components\/Icon\.tsx$/ }, (a) => ({
          loader: "tsx",
          contents: `const ICONS = ${JSON.stringify(icons)};\n` + readFileSync(a.path, "utf8").replace("url(/v1120/icons/${name}.svg)", "url(${ICONS[name]})"),
        }));
      },
    },
  ],
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
<style>${inlineAssets(css)}</style>
</head>
<body class="flex min-h-full flex-col">
<div id="root" class="flex min-h-full flex-1 flex-col"></div>
<script>${inlineAssets(js.outputFiles[0].text).replace(/<\/script/gi, "<\\/script")}</script>
</body>
</html>`;
// DEMO_OUT: 시험용으로 다른 곳에 만들 때 (키가 든 demo/ 파일을 덮지 않게)
const out = process.env.DEMO_OUT ? path.resolve(process.env.DEMO_OUT) : path.join(root, "demo/sondaeum-demo.html");
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`${out} ${(html.length / 1e6).toFixed(1)}MB, Groq 키 ${key ? "넣음" : "없음(낱말 찾기로 정리)"}`);
