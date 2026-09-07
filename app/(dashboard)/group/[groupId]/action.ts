"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getAuthedUser } from "@/lib/get-user";
import { db } from "@/lib/db";
import { groupMembers, cycles } from "@/lib/db/schema";
import { startNextCycle, completeCycle as completeCycleLogic } from "@/lib/utils/rotation";
import { createNotifications } from "@/lib/notification/create";

type ActionResult = { error: string } | { success: true };

type StartCycleResult = { error: string } | { success: true };

async function requireAdmin(groupId: string, userId: string) {
  const membership = await db.query.groupMembers.findFirst({
    where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)),
  });

  return membership && (membership.role === "owner" || membership.role === "admin")
    ? membership
    : null;
}

export async function startCycle(groupId: string): Promise<StartCycleResult> {
  const { authUser } = await getAuthedUser();

  const admin = await requireAdmin(groupId, authUser.id);

  if(!admin) {
    return { error: "Only the group owner or the admin can start a cycle."};
  }

  const existingActiveCycle = await db.query.cycles.findFirst({
    where: and(eq(cycles.groupId, groupId), eq(cycles.payoutStatus, "pending")),
  });

  if (existingActiveCycle) {
    return { error: "There's already an active cycle for this group." };
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

export async function completeCycle(groupId: string, cycleId: string): Promise<ActionResult> {
  const { authUser } = await getAuthedUser();

  const admin = await requireAdmin(groupId, authUser.id);

  if (!admin) {
    return { error: "Only the group owner or an admin can complete a cycle." };
  }

  const cycle = await db.query.cycles.findFirst({ where: eq(cycles.id, cycleId) });

  if (!cycle || cycle.groupId !== groupId) {
    return { error: "Cycle not found." };
  }

  try {
    await completeCycleLogic(cycleId);
  } catch (err) {
    console.error("completecycles failed:", err);
    const message = err instanceof Error ? err.message : "something went wrong.";
    return { error: message };
  }

  revalidatePath(`/group/${groupId}`);
  revalidatePath(`/group/${groupId}/contribute`);
  revalidatePath("/wallet");
  revalidatePath("/wallet/transaction")
  revalidatePath("/dashboard");
  return { success: true };
}