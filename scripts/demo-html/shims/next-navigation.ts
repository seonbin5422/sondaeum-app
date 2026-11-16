// 시연 HTML용: next/navigation 대신 주소 #뒤(해시)로 화면을 바꾼다. file://에서는 경로 이동을 못 해서.
import { useSyncExternalStore } from "react";

const sub = (cb: () => void) => (addEventListener("hashchange", cb), () => removeEventListener("hashchange", cb));
export const currentPath = () => decodeURI(location.hash.slice(1)) || "/v1120/visit/demo/record";
export const go = (href: string, replace = false) => {
  scrollTo(0, 0);
  if (replace) location.replace("#" + href);
  else location.hash = href;
};
export function useRouter() {
  return { push: (h: string) => go(h), replace: (h: string) => go(h, true), back: () => history.back(), refresh: () => dispatchEvent(new HashChangeEvent("hashchange")), prefetch: () => {} };
}
export function usePathname() {
  return useSyncExternalStore(sub, () => currentPath().split("?")[0]);
}
export function useSearchParams() {
  const q = useSyncExternalStore(sub, () => currentPath().split("?")[1] ?? "");
  return new URLSearchParams(q);
}
export function useParams<T>() {
  const p = usePathname().split("/");
  return { id: p[3], token: p[3] } as T;
}
export function redirect(h: string): never {
  go(h, true);
  throw new Error("redirect");
}
export function notFound(): never {
  throw new Error("notFound");
}
