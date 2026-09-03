"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getAuthedUser } from "@/lib/get-user";
import { db } from "@/lib/db";
import { groupMembers, cycles } from "@/lib/db/schema";
import { startNextCycle } from "@/lib/utils/rotation";
import { createNotifications } from "@/lib/notification/create";

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

  try {
  const activeMembers = await db.query.groupMembers.findMany({
    where: and(
      eq(groupMembers.groupId, groupId),
      eq(groupMembers.status, "active")
    ),
    columns: {
      userId: true,
    },
  });

  await createNotifications(
    db,
    activeMembers.map((member) => ({
      userId: member.userId,
      groupId,
      type: "cycle_started" as const,
      title: "A new cycle has started",
      body: "A new cycle has been started for your group.",
    }))
  );
} catch (err) {
  console.error("Failed to create cycle notifications:", err);
}

  revalidatePath(`/group/${groupId}`);
  return { success: true };
}