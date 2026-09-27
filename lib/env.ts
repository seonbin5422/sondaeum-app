/**
 * Vercel env values set via a piped stdin (`"value" | vercel env add ...`)
 * can pick up a stray leading BOM (U+FEFF), which breaks strict consumers
 * like fetch's ByteString header encoding or URL parsing — strip it
 * defensively wherever an env value is read.
 */
export function cleanEnv(value: string | undefined): string | undefined {
  return value?.replace(/^﻿/, "").trim();
}
