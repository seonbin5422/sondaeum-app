// node scripts/gen-notices.mjs — 앱에 들어가는 npm 패키지의 저작권·라이선스 고지를 THIRD_PARTY_NOTICES.md로 모은다
// 패키지를 더하거나 올리면 다시 돌린다. 개발 도구(devDependencies)는 배포되지 않아 넣지 않는다
import { execSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const tree = JSON.parse(execSync("npm ls --omit=dev --all --json", { maxBuffer: 64 << 20 }).toString());
const pkgs = new Map();
(function walk(deps) {
  for (const [name, d] of Object.entries(deps ?? {})) {
    const key = `${name}@${d.version}`;
    if (!d.version || pkgs.has(key)) continue;
    const dir = join("node_modules", name);
    let pj;
    try {
      pj = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    } catch {
      continue; // 이 운영체제에 설치되지 않은 선택 패키지
    }
    if (pj.version !== d.version) continue; // 다른 버전이 중첩 설치된 경우는 그 자리에서 다시 만난다
    // 맨 위에 없으면 dist/ 안을 본다 (Pretendard는 dist/LICENSE.txt)
    const find = (d) => {
      try {
        return readdirSync(d).filter((f) => /^(licen[cs]e|copying|notice)/i.test(f)).map((f) => join(d, f));
      } catch {
        return [];
      }
    };
    const files = find(dir).length ? find(dir) : find(join(dir, "dist"));
    const text = (re) => files.filter((f) => re.test(f.split("/").pop())).map((f) => readFileSync(f, "utf8").trim()).join("\n\n");
    pkgs.set(key, {
      key,
      license: typeof pj.license === "string" ? pj.license : (pj.licenses?.map?.((l) => l.type).join(" OR ") ?? "표기 없음"),
      repo: typeof pj.repository === "string" ? pj.repository : pj.repository?.url,
      licenseText: text(/^(licen[cs]e|copying)/i),
      notice: text(/^notice/i),
    });
    walk(d.dependencies);
  }
})(tree.dependencies);

const list = [...pkgs.values()].sort((a, b) => a.key.localeCompare(b.key));
const out = [
  "# Third-party notices",
  "",
  "손다음 앱에 포함되어 배포되는 오픈소스 패키지와 저작물의 저작권·라이선스 고지다. `node scripts/gen-notices.mjs`로 만든다 (직접 고치지 않는다).",
  "",
  "운영체제마다 다른 실행 파일 패키지(`*-darwin-arm64` 등)는 만든 컴퓨터 기준이다. 배포 서버(Linux)에서는 같은 라이선스의 `*-linux-x64` 패키지가 쓰인다.",
  "",
  "`@img/sharp-libvips-*`는 이미지 처리 라이브러리 libvips(LGPL-3.0-or-later)를 고치지 않은 채 서버에서 동적으로 불러 쓴다. 원본 소스: https://github.com/libvips/libvips , https://github.com/lovell/sharp-libvips",
  "",
  "## 패키지가 아닌 저작물",
  "",
  "- **Material Symbols** (`public/brand/calendar-icon.svg`의 calendar_month 아이콘) — Copyright Google LLC, Apache License 2.0. https://github.com/google/material-design-icons",
  "",
  "## npm 패키지",
  "",
  "| 패키지 | 라이선스 |",
  "| --- | --- |",
  ...list.map((p) => `| ${p.key} | ${p.license} |`),
  "",
  "## 라이선스 전문",
  "",
  ...list.flatMap((p) => [
    `### ${p.key} (${p.license})`,
    "",
    p.repo ? `저장소: ${p.repo.replace(/^git\+/, "")}` : "",
    "",
    "```",
    p.licenseText || `(패키지에 라이선스 파일이 없음. package.json 표기: ${p.license})`,
    "```",
    ...(p.notice ? ["", "NOTICE:", "", "```", p.notice, "```"] : []),
    "",
  ]),
];
writeFileSync("THIRD_PARTY_NOTICES.md", out.join("\n"));
console.log(`${list.length}개 패키지 → THIRD_PARTY_NOTICES.md`);
