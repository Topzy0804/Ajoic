"use server";

import { eq, and, count } from "drizzle-orm";
import { getAuthedUser } from "@/lib/get-user";
import { db } from "@/lib/db";
import { groups, groupMembers } from "@/lib/db/schema";

type JoinGroupResult = { error: string } | { success: true };

const MAX_POSITION_RETRIES = 3;

export async function joinGroup(groupId: string): Promise<JoinGroupResult> {
  const { authUser } = await getAuthedUser();

  const group = await db.query.groups.findFirst({ where: eq(groups.id, groupId) });

  if (!group) {
    return { error: "Group not found." };
  }

  if (group.status !== "active") {
    return { error: "This group is not accepting new members right now." };
  }

  const existing = await db.query.groupMembers.findFirst({
    where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, authUser.id)),
  });

  if (existing) {
    if (existing.status === "active") {
      return { success: true };
    }
    return { error: "You previously left this group and can not rejoin automatically." };
  }

  for (let attempt = 0; attempt < MAX_POSITION_RETRIES; attempt++) 
  {
    const [{ value: memberCount }] = await db
      .select({ value: count() })
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.status, "active")));

      if (memberCount >= group.memberCap) {
        return { error: "This group is full." };
      }

      try {
        await db.insert(groupMembers).values({
          groupId,
          userId: authUser.id,
          role: "member",
          position: memberCount + 1,
        });
        return { success: true };
      } catch (err: any) {
        const isPositionConflict = err?.code == "23505";
        if (!isPositionConflict || attempt === MAX_POSITION_RETRIES - 1) {
          console.error("JoinGroup failed:", err);
          return { error: "Something went wrong joining the group. please try again." };
        }
      }
  }

  return { error: "Something went wrong joining the group. please try again." };
}