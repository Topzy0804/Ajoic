"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getAuthedUser } from "@/lib/get-user";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";

export async function markNotificationRead(notificationId: string) {
  const { authUser } = await getAuthedUser();

  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, authUser.id)));

  revalidatePath("/notification");
}


export async function markAllNotificationsRead() {
  const { authUser } = await getAuthedUser();

  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, authUser.id), eq(notifications.read, false)));

  revalidatePath("/notifications");
}