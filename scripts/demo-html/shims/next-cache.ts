// 시연 HTML용 next/cache: 저장 뒤 지금 화면을 다시 그린다
const refresh = () => dispatchEvent(new Event("demo-refresh"));
export const revalidatePath = refresh;
export const revalidateTag = refresh;
export const unstable_noStore = () => {};
