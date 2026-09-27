type VisitStatus =
  | "NOT_STARTED"
  | "RECORDING"
  | "RECORDED"
  | "SUMMARIZING"
  | "DRAFT_READY"
  | "SENT";

const LABELS: Record<VisitStatus, string> = {
  NOT_STARTED: "시작 전",
  RECORDING: "녹음중",
  RECORDED: "녹음 완료",
  SUMMARIZING: "AI 정리중",
  DRAFT_READY: "검토 대기",
  SENT: "전송 완료",
};

const STYLES: Record<VisitStatus, string> = {
  NOT_STARTED: "bg-gray-100 text-gray-600",
  RECORDING: "bg-red-50 text-record",
  RECORDED: "bg-accent-soft text-accent-soft-foreground",
  SUMMARIZING: "bg-accent-soft text-accent-soft-foreground",
  DRAFT_READY: "bg-amber-50 text-amber-700",
  SENT: "bg-accent text-accent-foreground",
};

export function StatusBadge({ status }: { status: VisitStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${STYLES[status]}`}
    >
      {status === "RECORDING" && (
        <span className="mr-1.5 h-2 w-2 animate-pulse rounded-full bg-record" />
      )}
      {LABELS[status]}
    </span>
  );
}
