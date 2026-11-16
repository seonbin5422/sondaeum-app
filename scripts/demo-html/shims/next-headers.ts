// 시연 HTML용 next/headers: 쿠키는 localStorage에, 요청 헤더는 이 브라우저 값으로
const KEY = "sondaeum-demo-cookies";
const read = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
};
const write = (c: Record<string, string>) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
  } catch {}
};
export async function cookies() {
  return {
    get: (name: string) => (name in read() ? { name, value: read()[name] } : undefined),
    getAll: () => Object.entries(read()).map(([name, value]) => ({ name, value })),
    has: (name: string) => name in read(),
    set: (name: string | { name: string; value: string }, value?: string) => {
      const [n, v] = typeof name === "string" ? [name, value ?? ""] : [name.name, name.value];
      write({ ...read(), [n]: v });
    },
    delete: (name: string) => {
      const c = read();
      delete c[name];
      write(c);
    },
  };
}
export async function headers() {
  return new Headers({ "user-agent": navigator.userAgent, host: "demo" });
}
