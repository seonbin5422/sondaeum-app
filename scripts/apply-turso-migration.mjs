import { createClient } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  const env = {};
  for (const line of lines) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
  return env;
}

async function main() {
  const env = loadEnvLocal();
  const client = createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });

  const info = await client.execute(
    "SELECT name FROM pragma_table_info('Client') WHERE name = 'personalNotes'"
  );
  const existing = new Set(info.rows.map((r) => r.name));

  if (existing.has("personalNotes")) {
    console.log("skip (already exists): personalNotes");
  } else {
    await client.execute('ALTER TABLE "Client" ADD COLUMN "personalNotes" TEXT');
    console.log('applied: ALTER TABLE "Client" ADD COLUMN "personalNotes" TEXT');
  }

  const after = await client.execute("SELECT name FROM pragma_table_info('Client')");
  console.log(
    "Client columns now:",
    after.rows.map((r) => r.name)
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
