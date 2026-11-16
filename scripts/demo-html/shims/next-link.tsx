import type { AnchorHTMLAttributes } from "react";
import { go } from "./next-navigation";

// 시연 HTML용 next/link: 앱 안 주소는 해시로 옮긴다
export default function Link({ href, replace, prefetch: _p, scroll: _s, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; replace?: boolean; prefetch?: unknown; scroll?: unknown }) {
  const inApp = href.startsWith("/");
  return (
    <a
      {...rest}
      href={inApp ? "#" + href : href}
      onClick={(e) => {
        rest.onClick?.(e);
        if (inApp && !e.defaultPrevented) {
          e.preventDefault();
          go(href, replace);
        }
      }}
    />
  );
}
export const useLinkStatus = () => ({ pending: false });
