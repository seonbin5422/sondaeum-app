export function Logo({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local SVG, optimization not applicable
    <img src="/brand/logo-full.svg" alt="손다음" className={`h-8 w-auto ${className}`} />
  );
}
