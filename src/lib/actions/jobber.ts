"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { clearJobberConnection } from "@/lib/jobber-connection";

export async function disconnectJobberAction() {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  await clearJobberConnection(true);
  revalidatePath("/settings");
  revalidatePath("/settings/integrations");
  revalidatePath("/settings/integrations/jobber");
  revalidatePath("/pull");
  redirect("/settings/integrations/jobber?disconnected=1");
}
