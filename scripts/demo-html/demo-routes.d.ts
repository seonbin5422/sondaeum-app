// build.mjs가 만드는 1120 화면 목록 (app/v1120 아래 page.tsx 전부)
declare module "demo:routes" {
  export const routes: { path: string; page: unknown }[];
}
