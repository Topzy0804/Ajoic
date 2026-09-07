import { schedules } from "@trigger.dev/sdk";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { cycles } from "@/lib/db/schema";
import { checkAndAdvanceCycle } from "@/lib/utils/rotation";


export const checkCyclesTask = schedules.task({
  id: "check-and-advance-cycles",
  cron: "*/15 * * * *", // every 15 minutes
  run: async () => {
    const activeCycles = await db.query.cycles.findMany({
      where: eq(cycles.payoutStatus, "pending"),
      columns: { groupId: true },
    });

    const uniqueGroupIds = [...new Set(activeCycles.map((c) => c.groupId))];

    let checked = 0;
    let failed = 0;

    for (const groupId of uniqueGroupIds) {
      try {
        await checkAndAdvanceCycle(groupId);
        checked++;
      } catch (err) {
        failed++;
        console.error(`checkCyclesTask: failed for group ${groupId}:`, err);
      }
    }

    return { groupsWithActiveCycles: uniqueGroupIds.length, checked, failed };
  },
});