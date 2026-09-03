import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { groups, groupMembers, cycles, contributions } from "@/lib/db/schema";

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

export async function startNextCycle(groupId: string): Promise<string> {
  return db.transaction(async (tx) => {
    const group = await tx.query.groups.findFirst({ where: eq(groups.id, groupId) });
    if (!group) throw new Error("Group not found");

    const activeMembers = await tx.query.groupMembers.findMany({
      where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.status, "active")),
    });

    if (activeMembers.length < 2) {
      throw new Error("A group needs at least 2 active members to start a cycle");
    }

    const sortedMembers = [...activeMembers].sort((a, b) => a.position - b.position);

    const cycleNumber = group.currentCycleNumber;
    const recipientIndex = (cycleNumber - 1) % sortedMembers.length;
    const recipient = sortedMembers[recipientIndex];

    const intervalDays = getCycleIntervalDays(group);
    const startDate = addDays(new Date(), 1);
    const endDate = addDays(startDate, intervalDays - 1);

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