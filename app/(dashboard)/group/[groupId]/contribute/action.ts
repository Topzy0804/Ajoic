"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getAuthedUser } from "@/lib/get-user";
import { db } from "@/lib/db";
import { contributions, groupMembers } from "@/lib/db/schema";

type SubmitReceiptResult = { error: string } | { success: true };

export async function submitReceipt(
  contributionId: string,
  receiptPath: string
): Promise<SubmitReceiptResult> {
  const { authUser } = await getAuthedUser();

  const contribution = await db.query.contributions.findFirst({
    where: eq(contributions.id, contributionId),
    with: { member: true },
  });

  if (!contribution) {
    return { error: "Contribution is not found." };
  }

  if (contribution.member.userId !== authUser.id) {
    return { error: "you can't submit a receipt for someone else's contribution." };
  }

  if (contribution.status !== "pending" && contribution.status !== "rejected") {
    return { error: "This contribution has already been submitted or confirmed." };
  }

  await db
    .update(contributions)
    .set({
      receiptUrl: receiptPath,
      status: "submitted",
      submittedAt: new Date(),
      rejectionReason: null,
    })
    .where(eq(contributions.id, contributionId));

    const groupMember = await db.query.groupMembers.findFirst({
      where: eq(groupMembers.id, contribution.groupMemberId),
    });

    if (groupMember) {
      revalidatePath(`/group/${groupMember.groupId}`);
      revalidatePath(`/group/${groupMember.groupId}/contribute`);
    }

    return { success: true };
}