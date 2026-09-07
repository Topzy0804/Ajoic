import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { 
  groups, 
  groupMembers, 
  cycles, 
  contributions, 
  users, 
  walletTransactions 
} from "@/lib/db/schema";
import { createNotifications } from "@/lib/notification/create";

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getCycleIntervalDays(group: {
  frequency: "daily" | "weekly" | "monthly" | "custom";
  customFrequencyDays: number | null;
}): number {
  switch (group.frequency) {
    case "daily":
      return 1;
    case "weekly":
      return 7;
    case "monthly":
      return 30;
    case "custom":
      return group.customFrequencyDays ?? 30;
  }
}

function getCycleEndDate(
  startDate: Date,
  group: {
    frequency: "daily" | "weekly" | "monthly" | "custom";
    customFrequencyDays: number | null;
  }
): Date {
  if (group.frequency === "monthly") {
    const result = new Date(startDate);

    return new Date(result.getFullYear(), result.getMonth() + 1, result.getDate());
  }

  const intervalDays = getCycleIntervalDays(group);

  return addDays(startDate, intervalDays - 1);
}

export async function startNextCycle(groupId: string): Promise<string | null> {
  return db.transaction(async (tx) => {
    const group = await tx.query.groups.findFirst({ where: eq(groups.id, groupId) });

    if (!group) throw new Error("Group not found");

    const activeCycle = await tx.query.cycles.findFirst({
      where: and(
        eq(cycles.groupId, groupId),
        eq(cycles.payoutStatus, "pending")
      ),
    });

    if (activeCycle) {
      throw new Error("this group already has an active cycle");
    }

    const activeMembers = await tx.query.groupMembers.findMany({
      where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.status, "active")),
    });

    if (activeMembers.length < 2) {
      throw new Error("A group needs at least 2 active members to start a cycle");
    }

    const sortedMembers = [...activeMembers].sort((a, b) => a.position - b.position);

    const cycleNumber = group.currentCycleNumber;

    if (cycleNumber < 1) {
      throw new Error("Invalid current cycle number");
    }

    if (cycleNumber > sortedMembers.length) {
      await tx
        .update(groups)
        .set({ status: "completed" })
        .where(eq(groups.id, groupId));
      return null;
    }

    const recipientIndex = (cycleNumber - 1) % sortedMembers.length;

    const recipient = sortedMembers[recipientIndex];

    if (!recipient) {
      throw new Error("Unable to determine cycle recipient");
    }

    // const intervalDays = getCycleIntervalDays(group);
    const startDate = addDays(new Date(), 1);
    const endDate = getCycleEndDate(startDate, group);

    const [cycle] = await tx
      .insert(cycles)
      .values({
        groupId,
        cycleNumber,
        recipientMemberId: recipient.id,
        startDate: toDateOnly(startDate),
        endDate: toDateOnly(endDate),
      })
      .returning({ id: cycles.id });

      if (!cycle) {
        throw new Error("Failed to create cycle");
      }

      await tx.insert(contributions).values(
        sortedMembers.map((member) => ({
          cycleId: cycle.id,
          groupMemberId: member.id,
          amount: group.contributionAmount,
          status: "pending" as const,
        }))
      );

      await tx
        .update(groups)
        .set({ currentCycleNumber: cycleNumber + 1 })
        .where(eq(groups.id, groupId));

        return cycle.id;
    });
  }

  export async function checkAndAdvanceCycle(groupId: string): Promise<void> {

    const group = await db.query.groups.findFirst({ where: eq(groups.id, groupId) });

    if (!group || group.status !== "active") {
      return;
    }

    const activeCycle = await db.query.cycles.findFirst({
      where: and(
        eq(cycles.groupId, groupId),
        eq(cycles.payoutStatus, "pending")
      ),
      with: {
        contributions: true,
        recipient: true,
      },
    });

    if (!activeCycle) {
      return;
    }

    const allPaid = activeCycle.contributions.every((c) => c.status === "paid");

    const deadLinePassed = new Date() > new Date(activeCycle.endDate);

    if (!allPaid && !deadLinePassed) {
      return;
    }

    const cycleId = activeCycle.id;

    await db.transaction(async (tx) => {

      const cycle = await tx.query.cycles.findFirst({
        where: eq(cycles.id, cycleId),
        with: { contributions: true, recipient: true },
      });

      if (!cycle) {
        return;
      }

      if (cycle.payoutStatus !== "pending") {
        return;
      }

      const currentDate = new Date();
      const cycleDeadline = new Date(cycle.endDate);

      const cycleDeadLinePassed = currentDate > cycleDeadline;

      if (cycleDeadLinePassed) {
        const stillUnPaids = cycle.contributions
          .filter((c) => c.status !== "paid");

        for (const contribution of stillUnPaids) {
          await tx.update(contributions).set({ status: "late" }).where(eq(contributions.id, contribution.id));
        }
      }

      const totalAmount = cycle.contributions
        .filter((c) => c.status === "paid")
        .reduce((sum, c) => sum + Number(c.amount), 0);

        const updatedCycles = await tx
        .update(cycles)
        .set({ payoutStatus: "paid", payoutAt: new Date() })
        .where(
          and(
            eq(cycles.id, cycleId),
            eq(cycles.payoutStatus, "pending")
          )
        )
        .returning({ id: cycles.id, });

        if (updatedCycles.length === 0) {
          return;
        }

        const [recipientUser] = await tx
          .select()
          .from(users)
          .where(eq(users.id, cycle.recipient.userId))
          .limit(1);

          if (!recipientUser) {
            throw new Error("Recipient user not found");
          }

        if (totalAmount > 0) {
          const newBalance = (Number(recipientUser.walletBalance) + totalAmount).toFixed(2);

      await tx.insert(walletTransactions).values({
        userId: cycle.recipient.userId,
        type: "payout",
        amount: totalAmount.toFixed(2),
        status: "completed",
        reference: cycleId,
      });

      await tx
        .update(users)
        .set({ walletBalance: newBalance })
        .where(eq(users.id, cycle.recipient.userId));
    }


        const activeMembers = await tx.query.groupMembers.findMany({
          where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.status, "active")),
        });

        if (activeMembers.length > 0) {
        await createNotifications(
          tx,
          activeMembers.map((member) => ({
            userId: member.userId,
            groupId,
            type: "cycle_started" as const,
            title: `Cycle ${cycle.cycleNumber} completed`,
            body: "Payout has been sent. A new cycle will start shortly.",
}))
        );
      }
    });

    try {
      const newCycleId = await startNextCycle(groupId);

      if (newCycleId === null) {
        console.log(`checkAndAdvanceCycle: group ${groupId} has completed all cycles.`);
      }
    } catch (err) {
      console.error(`checkAndAdvanceCycle: couldn't auto-start next cycle for ${groupId}:`, err);
    }
  }

  export async function completeCycle(cycleId: string): Promise<void> {
    const cycle = await db.query.cycles.findFirst({
      where: eq(cycles.id, cycleId),
    });

    if (!cycle) {
      throw new Error("cycle not found");
    }

    await checkAndAdvanceCycle(cycle.groupId);  
  }