import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSessionCaregiverId } from "@/lib/session";

export const verifySession = cache(async () => {
  const caregiverId = await getSessionCaregiverId();
  if (!caregiverId) redirect("/login");
  return { caregiverId };
});
