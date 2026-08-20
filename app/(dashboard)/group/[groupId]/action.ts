"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getAuthedUser } from "@/lib/get-user";
import { db } from "@/lib/db";
import { groupMembers, cycles } from "@/lib/db/schema";
import { startNextCycle } from "@/lib/utils/rotation";

type StartCycleResult = { error: string } | { success: true };

export async function startCycle(groupId: string): Promise<StartCycleResult> {
  const { authUser } = await getAuthedUser();

  const membership = await db.query.groupMembers.findFirst({
    where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, authUser.id)),
  });

  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
    return { error: "Only the group owner or admin can start a cycle." };
  }

  const existingActiveCycle = await db.query.cycles.findFirst({
    where: and(eq(cycles.groupId, groupId), eq(cycles.payoutStatus, "pending"),)
  });

  if (existingActiveCycle) {
    return { error: "there is already an active cycle for this group." };
  }

  try {
    await startNextCycle(groupId);
  } catch (err) {
    console.error("startCycle failed:", err);
    const message = err instanceof Error ? err.message : "something went wrong.";
    return { error: message };
  }

  revalidatePath(`/group/${groupId}`);
  return { success: true };
}