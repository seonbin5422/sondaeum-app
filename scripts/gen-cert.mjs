// 로컬 HTTPS 개발용 자체 서명 인증서 생성 스크립트.
// LAN IP가 바뀌면 아래 altNames의 IP를 바꾸고 다시 실행하세요: node scripts/gen-cert.mjs
import selfsigned from "selfsigned";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

async function main() {
  const attrs = [{ name: "commonName", value: "localhost" }];
  const pems = await selfsigned.generate(attrs, {
    days: 365,
    keySize: 2048,
    extensions: [
      {
        name: "subjectAltName",
        altNames: [
          { type: 2, value: "localhost" },
          { type: 7, ip: "127.0.0.1" },
          { type: 7, ip: "192.168.100.100" },
        ],
      },
    ],
  });

  const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "certificates");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "localhost.pem"), pems.cert);
  fs.writeFileSync(path.join(dir, "localhost-key.pem"), pems.private);
  console.log("cert written to", dir);
}

main();
