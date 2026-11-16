// 시연 HTML용 next/navigation: 주소 # 뒤(해시)로 화면을 바꾼다. file://에서는 경로 이동을 못 해서.
import { useSyncExternalStore } from "react";

const sub = (cb: () => void) => (addEventListener("hashchange", cb), () => removeEventListener("hashchange", cb));
export const currentPath = () => decodeURI(location.hash.slice(1)) || "/v1120";
export const go = (href: string, replace = false) => {
  if (!href.startsWith("/")) return void (location.href = href);
  if (currentPath() === href) return void dispatchEvent(new Event("demo-refresh"));
  scrollTo(0, 0);
  if (replace) location.replace("#" + href);
  else location.hash = href;
};

// 서버의 redirect()·notFound(): 던져서 그 자리 실행을 멈추고, 화면 틀(entry.tsx)이 받아서 옮긴다
export class RedirectSignal extends Error {
  constructor(public href: string) {
    super(`redirect ${href}`);
  }
}
export class NotFoundSignal extends Error {}
export function redirect(href: string): never {
  throw new RedirectSignal(href);
}
export const permanentRedirect = redirect;
export function notFound(): never {
  throw new NotFoundSignal("notFound");
}

// 지금 화면 주소의 [id]·[token] 값 (entry.tsx가 화면을 그리기 전에 넣는다)
let params: Record<string, string> = {};
export const setParams = (p: Record<string, string>) => void (params = p);

export function useRouter() {
  return { push: (h: string) => go(h), replace: (h: string) => go(h, true), back: () => history.back(), forward: () => history.forward(), refresh: () => dispatchEvent(new Event("demo-refresh")), prefetch: () => {} };
}
export function usePathname() {
  return useSyncExternalStore(sub, () => currentPath().split("?")[0]);
}
export function useSearchParams() {
  const q = useSyncExternalStore(sub, () => currentPath().split("?")[1] ?? "");
  return new URLSearchParams(q);
}
export function useParams<T>() {
  return params as T;
}
export const useSelectedLayoutSegment = () => null;
