import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { getAuthedUser } from "@/lib/get-user";
import { db } from "@/lib/db";
import { groups, cycles } from "@/lib/db/schema";
import { formatCurrency, formatFrequency } from "@/lib/utils/format";
import { InviteLink } from "@/app/(dashboard)/group/invite-link";
import { StartCycleButton } from "@/components/group/start-cycle-button";
import { CompleteCycleButton } from "@/components/group/completeCycleButton";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const { authUser } = await getAuthedUser();

  const group = await db.query.groups.findFirst({
    where: eq(groups.id, groupId),
    with: {
      members: { with: { user: true } },
    },
  });

  if (!group) {
    notFound();
  }

  const currentMembership = group.members.find(
    (m) => m.userId === authUser.id && m.status === "active"
  );

  if (!currentMembership) {
    notFound();
  }

  const isAdmin = currentMembership.role === "owner" || currentMembership.role === "admin";

  const activeMembers = [...group.members]
    .filter((m) => m.status === "active")
    .sort((a, b) => a.position - b.position);

  const activeCycle = await db.query.cycles.findFirst({
      where: and(eq(cycles.groupId, group.id), eq(cycles.payoutStatus, "pending")),
      with: {
        recipient: { with: { user: true } },
        contributions: { with: { member: { with: { user: true } } } },
      },
      orderBy: (c, { desc }) => desc(c.cycleNumber),
    });

  const myContribution = activeCycle?.contributions.find(
    (c) => c.groupMemberId === currentMembership.id
  );

  const statusStyles: Record<string, string> = {
    pending: "bg-neutral-100 text-neutral-600",
    submitted: "bg-blue-50 text-blue-700",
    paid: "bg-green-50 text-green-700",
    rejected: "bg-red-50 text-red-700",
    late: "bg-amber-50 text-amber-700",
  };

    return (
      <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">{group.name}</h1>
          {group.description && (
            <p className="mt-1 text-sm text-neutral-500">{group.description}</p>
          )}
        </div>
        {isAdmin && (
          <Link
            href={`/group/${group.id}/settings`}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Settings
          </Link>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Contribution</p>
          <p className="mt-1 font-semibold text-neutral-900">
            {formatCurrency(group.contributionAmount)}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Frequency</p>
          <p className="mt-1 font-semibold text-neutral-900">{formatFrequency(group)}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Members</p>
          <p className="mt-1 font-semibold text-neutral-900">
            {activeMembers.length} / {group.memberCap}
          </p>
        </div>
      </div>

      {group.paymentMethod === "offline" && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">Payment account</p>
          <p className="mt-1 text-sm text-amber-800">
            {group.payoutAccountName} · {group.payoutAccountNumber} ·{" "}
            {group.payoutBankName}
          </p>
          <p className="mt-1 text-xs text-amber-700">
            Pay into this account, then upload your receipt for confirmation.
          </p>
        </div>
      )}

      {isAdmin && <InviteLink groupId={group.id} />}

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3">
          <h2 className="text-sm font-medium text-neutral-900">Members</h2>
          <span className="text-xs text-neutral-400">Sorted by payout position</span>
        </div>
        <ul>
          {activeMembers.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between border-b border-neutral-100 px-5 py-3 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium text-neutral-600">
                  {member.position}
                </span>
                <span className="text-sm text-neutral-800">{member.user.fullName}</span>
              </div>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium capitalize text-neutral-600">
                {member.role}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {activeCycle ? (
        <div className="mt-6 rounded-xl border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3">
            <div>
              <h2 className="text-sm font-medium text-neutral-900">
                Cycle {activeCycle.cycleNumber}
              </h2>
              <p className="mt-0.5 text-xs text-neutral-500">
                {activeCycle.recipient.user.fullName} collects this cycle · due{" "}
                {activeCycle.endDate}
              </p>
            </div>
            {myContribution && (
              <Link
                href={`/group/${group.id}/contribute`}
                className="rounded-md bg-green-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-800"
              >
                {myContribution.status === "pending" || myContribution.status === "rejected"
                  ? "Contribute"
                  : "View my contribution"}
              </Link>
            )}
            {isAdmin && (
              <Link
                href={`/group/${group.id}/review`}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Review receipts
              </Link>
            )}
            {isAdmin && (
  <CompleteCycleButton
    groupId={group.id}
    cycleId={activeCycle.id}
    allPaid={activeCycle.contributions.every((c) => c.status === "paid")}
  />
)}
          </div>
          <ul>
            {activeCycle.contributions.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between border-b border-neutral-100 px-5 py-3 last:border-b-0"
              >
                <span className="text-sm text-neutral-800">{c.member.user.fullName}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[c.status]}`}
                >
                  {c.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center">
          <p className="text-sm text-neutral-500">No active cycle yet.</p>
          {isAdmin && activeMembers.length >= 2 && (
            <div className="mt-3 flex justify-center">
              <StartCycleButton groupId={group.id} />
            </div>
          )}
          {isAdmin && activeMembers.length < 2 && (
            <p className="mt-2 text-xs text-neutral-400">
              Invite at least one more member before starting a cycle.
            </p>
          )}
        </div>
      )}
    </div>
    );
}