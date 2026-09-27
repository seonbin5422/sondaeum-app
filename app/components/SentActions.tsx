"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { ShareLinkButton } from "@/app/components/ShareLinkButton";
import { CopyLinkButton } from "@/app/components/CopyLinkButton";

export function SentActions({
  url,
  guardianPath,
  title,
  text,
}: {
  url: string;
  guardianPath: string;
  title: string;
  text: string;
}) {
  const [shared, setShared] = useState(false);
  const router = useRouter();

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <Card className="w-full text-left">
        <p className="mb-2 text-base font-bold">보호자 확인용 링크</p>
        <a href={guardianPath} className="break-all text-base text-accent-dark underline">
          {url}
        </a>
        <CopyLinkButton url={url} onCopied={() => setShared(true)} />
      </Card>

      <ShareLinkButton url={url} title={title} text={text} onShared={() => setShared(true)} />

      <Button type="button" disabled={!shared} onClick={() => router.push("/")}>
        홈으로
      </Button>

      {!shared && (
        <p className="text-muted text-sm">링크 공유 또는 복사 후 홈으로 이동할 수 있어요.</p>
      )}
    </div>
  );
}
