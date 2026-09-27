"use client";

import { useState } from "react";

export function CopyLinkButton({ url, onCopied }: { url: string; onCopied?: () => void }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
      onCopied?.();
    } catch {
      setStatus("failed");
    }
    setTimeout(() => setStatus("idle"), 2500);
  }

  return (
    <div className="mt-2 flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleCopy}
        className="text-sm font-semibold text-accent-dark underline"
      >
        🔗 링크 복사하기
      </button>
      {status === "copied" && <p className="text-muted text-sm">링크가 복사되었어요.</p>}
      {status === "failed" && <p className="text-record text-sm">복사에 실패했어요.</p>}
    </div>
  );
}
