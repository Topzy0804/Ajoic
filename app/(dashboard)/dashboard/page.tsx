import { getAuthedUser } from '@/lib/get-user';
import { db } from '@/lib/db';
import { groupMembers, cycles } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { formatCurrency, formatFrequency } from '@/lib/utils/format';
import Link from 'next/link';


export default async function DashboardPage() {

  const { authUser, profile } = await getAuthedUser();

  const memberships = await db.query.groupMembers.findMany({
    where: and(eq(groupMembers.userId, authUser.id), eq(groupMembers.status, "active")),
    with: {
      group: {
        with: {
          cycles: {
            where: eq(cycles.payoutStatus, "pending"),
            orderBy: (c, { desc }) => desc(c.cycleNumber),
            limit: 1,
            with: {
              contributions: true,
              recipient: { with: { user: true } },
            },
          },
        },
      },
    },
  });

  const groupSummaries = memberships.map((membership) => {
    const activeCycle = membership.group.cycles[0] ?? null;
    const myContribution = activeCycle?.contributions.find(
      (c) => c.groupMemberId === membership.id
    );

    const isAdmin = membership.role === "owner" || membership.role === "admin";
    
    const pendingReviewCount = activeCycle
      ? activeCycle.contributions.filter((c) => c.status === "submitted").length
      : 0;

      return {
        membership,
        group: membership.group,
        activeCycle,
        myContribution,
        isAdmin,
        pendingReviewCount,
      };
  });

  const needsMyAction = groupSummaries.filter(
    (s) =>
      s.myContribution &&
      (s.myContribution.status === "pending" || s.myContribution.status === "rejected")
  );

  const needsMyReview = groupSummaries.filter((s) => s.isAdmin && s.pendingReviewCount > 0);

    return (
      <div>
      <h1 className="text-xl font-semibold text-neutral-900">
        Welcome, {profile?.fullName ?? "there"}
      </h1>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5">
        <p className="text-sm text-neutral-500">Wallet balance</p>
        <p className="mt-1 text-2xl font-semibold text-green-800">
          {formatCurrency(profile?.walletBalance ?? 0)}
        </p>
      </div>

      {(needsMyAction.length > 0 || needsMyReview.length > 0) && (
        <div className="mt-6">
          <h2 className="text-sm font-medium text-neutral-500">Needs your attention</h2>
          <div className="mt-2 flex flex-col gap-2">
            {needsMyAction.map((s) => (
              <Link
                key={`contribute-${s.group.id}`}
                href={`/group/${s.group.id}/contribute`}
                className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 hover:bg-amber-100"
              >
                <span className="text-sm text-amber-900">
                  {s.myContribution?.status === "rejected"
                    ? `Your receipt for "${s.group.name}" was rejected`
                    : `Contribution due for "${s.group.name}"`}
                </span>
                <span className="text-sm font-medium text-amber-900">
                  {formatCurrency(s.myContribution!.amount)}
                </span>
              </Link>
            ))}
            {needsMyReview.map((s) => (
              <Link
                key={`review-${s.group.id}`}
                href={`/group/${s.group.id}/review`}
                className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 hover:bg-blue-100"
              >
                <span className="text-sm text-blue-900">
                  {s.pendingReviewCount} receipt{s.pendingReviewCount === 1 ? "" : "s"}{" "}
                  awaiting review in &quot;{s.group.name}&quot;
                </span>
                <span className="text-sm font-medium text-blue-900">Review →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-500">Your groups</h2>
          <Link href="/group" className="text-sm font-medium text-green-700 underline">
            View all
          </Link>
        </div>

        {groupSummaries.length === 0 ? (
          <div className="mt-2 rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center">
            <p className="text-sm text-neutral-500">You&apos;re not in any group yet.</p>
            <Link
              href="/group/new"
              className="mt-2 inline-block text-sm font-medium text-green-700 underline"
            >
              Create your first group
            </Link>
          </div>
        ) : (
          <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groupSummaries.map((s) => (
              <Link
                key={s.group.id}
                href={`/group/${s.group.id}`}
                className="rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-green-700 hover:shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <p className="font-medium text-neutral-900">{s.group.name}</p>
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium capitalize text-green-700">
                    {s.membership.role}
                  </span>
                </div>
                <p className="mt-1 text-sm text-neutral-500">
                  {formatCurrency(s.group.contributionAmount)} ·{" "}
                  {formatFrequency(s.group)}
                </p>
                <p className="mt-2 text-xs text-neutral-400">
                  {s.activeCycle
                    ? `Cycle ${s.activeCycle.cycleNumber} · ${s.activeCycle.recipient.user.fullName} collects`
                    : "No active cycle"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
    );
}