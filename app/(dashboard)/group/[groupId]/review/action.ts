"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getAuthedUser } from "@/lib/get-user";
import { db } from "@/lib/db";
import { contributions, groupMembers } from "@/lib/db/schema";

type ReviewResult = { error: string } | { success: true };

async function getReviewerRole(contributionId: string, reviewerUserId: string) {
  const contribution = await db.query.contributions.findFirst({
    where: eq(contributions.id, contributionId),
    with: { member: true },
  });

  if (!contribution) return { contribution: null, isAdmin: false };

  const membership = await db.query.groupMembers.findFirst({
    where: (gm, { and, eq }) =>
      and(eq(gm.groupId, contribution.member.groupId), eq(gm.userId, reviewerUserId)),
  });

  const isAdmin = membership?.role === "owner" || membership?.role === "admin";
  return { contribution, isAdmin };
}

export async function confirmReceipt(contributionId: string): Promise<ReviewResult> {
  const { authUser } = await getAuthedUser();

  const { contribution, isAdmin } = await getReviewerRole(contributionId, authUser.id);

  if (!contribution) return { error: "contribution not found." };

  if (!isAdmin) return { error: "Only the group owner or an admin can confirm receipts." };

  if (contribution.status !== "submitted") {
    return { error: "this contribution isn't awaiting review." };
  }

  await db
    .update(contributions)
    .set({
      status: "paid",
      reviewedBy: authUser.id,
      reviewedAt: new Date(),
      paidAt: new Date(),
    })
    .where(eq(contributions.id, contributionId));

revalidatePath(`/group/${contribution.member.groupId}`);
    revalidatePath(`/group/${contribution.member.groupId}/review`);
    return { success: true };
}

export async function rejectReceipt(
  contributionId: string,
  reason: string
): Promise<ReviewResult> {
  const { authUser } = await getAuthedUser();

  if (!reason || reason.trim().length < 3) {
    return { error: "give a short reason so the member knows what to fix." };
  }

  const { contribution, isAdmin } = await getReviewerRole(contributionId, authUser.id);

  if (!contribution) return { error: "contribution not found." };

  if (!isAdmin) return { error: "Only the group owner or an admin can reject receipts." };

  if (contribution.status !== "submitted") {
    return { error: "this contribution isn't awaiting review." };
  }

  await db
    .update(contributions)
    .set({
      status: "rejected",
      reviewedBy: authUser.id,
      reviewedAt: new Date(),
    })
    .where(eq(contributions.id, contributionId));

  revalidatePath(`/group/${contribution.member.groupId}`);
  revalidatePath(`/group/${contribution.member.groupId}/review`);
  return { success: true };
}