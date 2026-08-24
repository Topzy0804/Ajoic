"use server";

import { revalidatePath } from "next/cache";
import { getAuthedUser } from "@/lib/get-user";
import { db } from "@/lib/db";
import { groups, groupMembers } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { createGroupSchema, type CreateGroupFormValues } from "@/lib/validation/group";

type ActionResult = { error: string } | { success: true };

async function getMembership(groupId: string, userId: string) {
  return db.query.groupMembers.findFirst({
    where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)),
  });
}

export async function updateGroup(
  groupId: string,
  input: CreateGroupFormValues
): Promise<ActionResult> {
  const { authUser } = await getAuthedUser();
  
  const membership = await getMembership(groupId, authUser.id);

  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
    return { error: "Only the owner or an admin can edit this group." };
  }

  const parsed = createGroupSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid Input" };
  }
  const data = parsed.data;

  await db
    .update(groups)
    .set({
      name: data.name,
      description: data.description || null,
      contributionAmount: data.contributionAmount.toFixed(2),
      frequency: data.frequency,
      customFrequencyDays:data.frequency === "custom" ? data.customFrequencyDays : null,
      memberCap: data.memberCap,
      payoutAccountName: data.payoutAccountName,
      payoutAccountNumber: data.payoutAccountNumber,
      payoutBankName: data.payoutBankName,
    })
    .where(eq(groups.id, groupId));

    revalidatePath(`/group/${groupId}`);
    revalidatePath(`/group/${groupId}/settings`);
  return { success: true };
}

export async function deleteGroup(groupId: string): Promise<ActionResult> {
  const { authUser } = await getAuthedUser();

  const membership = await getMembership(groupId, authUser.id);

  if (!membership || membership.role !== "owner") {
    return { error: "Only the group owner can delete this group." };
  }

  await db
    .delete(groups)
    .where(eq(groups.id, groupId));

    revalidatePath("/group");
    return { success: true };
}

export async function changeMembershipRole(
  groupId: string,
  memberId: string,
  newRole: "admin" | "member"
): Promise<ActionResult> {
  const { authUser } = await getAuthedUser();

  const membership = await getMembership(groupId, authUser.id);

  if (!membership || membership.role !== "owner") {
    return { error: "Only the group owner can change member roles." };
  }

  const target = await db.query.groupMembers.findFirst({
    where: eq(groupMembers.id, memberId),
  });

  if (!target || target.groupId !== groupId) return { error: "Member not found in this group." };

  if (target.role === "owner") return { error: "the owners role can't be changed." };

  await db
    .update(groupMembers)
    .set({
      role: newRole
    }).where(eq(groupMembers.id, memberId));

    revalidatePath(`/group/${groupId}/settings`);
    revalidatePath(`/group/${groupId}`);
  return { success: true };
}

export async function moveMemberPosition(
  groupId: string,
  memberId: string,
  direction: "up" | "down"
): Promise<ActionResult> {
  const { authUser } = await getAuthedUser();

  const membership = await getMembership(groupId, authUser.id);

  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
    return { error: "Only the owner and the admin can reorder members." }
  }

  const members = await db.query.groupMembers.findMany({
    where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.status, "active")),
  });

  const sorted = [...members].sort((a, b) => a.position - b.position);

  const idx = sorted.findIndex((m) => m.id === memberId);

  if (idx === -1) return { error: "Can't find the member in this group." };

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;

  if (swapIdx < 0 || swapIdx >= sorted.length) {
    return { error: "can't move further in that direction." };
  }

  const current = sorted[idx];
  const neighbor = sorted[swapIdx];

  await db.transaction(async (tx) => {
    await tx
      .update(groupMembers)
      .set({ position: -1 })
      .where(eq(groupMembers.id, current.id));

    await tx
      .update(groupMembers)
      .set({ position: current.position })
      .where(eq(groupMembers.id, neighbor.id));

    await tx
      .update(groupMembers)
      .set({ position: neighbor.position })
      .where(eq(groupMembers.id, current.id));
  });

  revalidatePath(`/group/${groupId}/settings`);
  revalidatePath(`/group/${groupId}`);
  return { success: true };
}