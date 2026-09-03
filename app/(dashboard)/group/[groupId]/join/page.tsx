import { and, count, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getAuthedUser } from "@/lib/get-user";
import { db } from "@/lib/db";
import { groups, groupMembers } from "@/lib/db/schema";
import { formatCurrency, formatFrequency } from "@/lib/utils/format";
import { JoinGroupButton } from "@/components/group/join-group-button";

export default async function JoinGroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const { authUser } = await getAuthedUser();

  const group = await db.query.groups.findFirst({ where: eq(groups.id, groupId) });
  if (!group) notFound();

  const existingMembership = await db.query.groupMembers.findFirst({
    where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, authUser.id)),
  });

  if (existingMembership?.status === "active") {
    redirect(`/group/${groupId}`);
  }

  const [{ value: memberCount }] = await db
    .select({ value: count() })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.status, "active")));

    const isFull = memberCount >= group.memberCap;


    return (
      <div className="mx-auto max-w-md">
      <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-green-700" />
        <h1 className="mt-4 text-lg font-semibold text-neutral-900">{group.name}</h1>
        {group.description && (
          <p className="mt-1 text-sm text-neutral-500">{group.description}</p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3 text-left">
          <div className="rounded-lg bg-neutral-50 p-3">
            <p className="text-xs text-neutral-500">Contribution</p>
            <p className="mt-0.5 text-sm font-medium text-neutral-900">
              {formatCurrency(group.contributionAmount)}
            </p>
          </div>
          <div className="rounded-lg bg-neutral-50 p-3">
            <p className="text-xs text-neutral-500">Frequency</p>
            <p className="mt-0.5 text-sm font-medium text-neutral-900">
              {formatFrequency(group)}
            </p>
          </div>
          <div className="col-span-2 rounded-lg bg-neutral-50 p-3">
            <p className="text-xs text-neutral-500">Members</p>
            <p className="mt-0.5 text-sm font-medium text-neutral-900">
              {memberCount} / {group.memberCap}
            </p>
          </div>
        </div>

        <div className="mt-6">
          {isFull ? (
            <p className="text-sm text-neutral-500">This group is currently full.</p>
          ) : (
            <JoinGroupButton groupId={groupId} />
          )}
        </div>
      </div>
    </div>
    )
}