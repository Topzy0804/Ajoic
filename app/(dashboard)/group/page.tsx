import Link from 'next/link';
import { eq, and } from 'drizzle-orm';
import { getAuthedUser } from '@/lib/get-user';
import { db } from '@/lib/db';
import { groupMembers } from '@/lib/db/schema';
import { formatCurrency, formatFrequency } from '@/lib/utils/format';
import {
  Crown,
  Plus,
  Users,
  Wallet,
  UserPlus,
  ArrowRight,
} from 'lucide-react';


export default async function GroupsPage() {
  const { authUser } = await getAuthedUser();

  const memberships = await db.query.groupMembers.findMany({
    where: and(eq(groupMembers.userId, authUser.id), eq(groupMembers.status, "active")),
    with: { group: true },
  });

  const totalGroups = memberships.length;

  const totalMemberCapacity = memberships.reduce(
    (total, { group }) => total + group.memberCap,
    0
  );

  const totalContributions = memberships.reduce(
    (total, { group }) => total + Number(group.contributionAmount),
    0
  );


  return (
    <div className="min-h-full bg-[#f7f5ef]">
      {/* Page header */}
      <div className="border-b border-[#e5e1d7] bg-white">
        <div className="px-4 py-6 sm:px-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#22261f]">
                Your groups
              </h1>

              <p className="mt-1 text-sm text-[#777b72]">
                Thrift groups you own or belong to.
              </p>
            </div>

            <Link
              href="/group/new"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#3e5c46] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2e4636]"
            >
              <Plus className="h-4 w-4" />
              Create group
            </Link>
          </div>
        </div>
      </div>

      <main className="px-4 py-6 sm:px-6">
        {/* Overview */}
        {memberships.length > 0 && (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total groups */}
            <div className="rounded-2xl border border-[#e4e0d7] bg-white p-5 shadow-[0_2px_10px_rgba(34,38,31,0.03)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f3eb] text-[#2e4636]">
                <Users className="h-5 w-5" />
              </div>

              <p className="mt-4 text-xs font-medium text-[#777b72]">
                Total groups
              </p>

              <p className="mt-1 text-2xl font-bold text-[#22261f]">
                {totalGroups}
              </p>

              <p className="mt-1 text-xs text-[#8b8e86]">
                Active memberships
              </p>
            </div>

            {/* Combined contribution */}
            <div className="rounded-2xl border border-[#e4e0d7] bg-white p-5 shadow-[0_2px_10px_rgba(34,38,31,0.03)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7ecd5] text-[#a07828]">
                <Wallet className="h-5 w-5" />
              </div>

              <p className="mt-4 text-xs font-medium text-[#777b72]">
                Combined contribution
              </p>

              <p className="mt-1 text-2xl font-bold text-[#22261f]">
                {formatCurrency(totalContributions)}
              </p>

              <p className="mt-1 text-xs text-[#8b8e86]">
                Across your groups
              </p>
            </div>

            {/* Member capacity */}
            <div className="rounded-2xl border border-[#e4e0d7] bg-white p-5 shadow-[0_2px_10px_rgba(34,38,31,0.03)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f3eb] text-[#2e4636]">
                <Users className="h-5 w-5" />
              </div>

              <p className="mt-4 text-xs font-medium text-[#777b72]">
                Member capacity
              </p>

              <p className="mt-1 text-2xl font-bold text-[#22261f]">
                {totalMemberCapacity}
              </p>

              <p className="mt-1 text-xs text-[#8b8e86]">
                Combined group capacity
              </p>
            </div>

            {/* Group ownership */}
            <div className="rounded-2xl border border-[#e4e0d7] bg-white p-5 shadow-[0_2px_10px_rgba(34,38,31,0.03)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7ecd5] text-[#a07828]">
                <Crown className="h-5 w-5" />
              </div>

              <p className="mt-4 text-xs font-medium text-[#777b72]">
                Groups you own
              </p>

              <p className="mt-1 text-2xl font-bold text-[#22261f]">
                {
                  memberships.filter(
                    ({ role }) => role === "owner"
                  ).length
                }
              </p>

              <p className="mt-1 text-xs text-[#8b8e86]">
                Groups managed by you
              </p>
            </div>
          </section>
        )}

        {/* Groups section */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#22261f]">
                All groups
              </h2>

              <p className="mt-1 text-xs text-[#777b72]">
                Your active thrift groups
              </p>
            </div>

            {memberships.length > 0 && (
              <span className="rounded-full bg-[#e9f5ed] px-3 py-1 text-xs font-semibold text-[#2e7d4f]">
                {memberships.length}{" "}
                {memberships.length === 1 ? "group" : "groups"}
              </span>
            )}
          </div>

          {memberships.length === 0 ? (
            /* Empty state */
            <div className="rounded-2xl border border-dashed border-[#cfc9ba] bg-white px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f3eb] text-[#3e5c46]">
                <Users className="h-7 w-7" />
              </div>

              <h2 className="mt-5 text-base font-bold text-[#22261f]">
                You&apos;re not in any group yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#777b72]">
                Create your first thrift group and start saving together
                with people you trust.
              </p>

              <Link
                href="/group/new"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#3e5c46] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2e4636]"
              >
                <Plus className="h-4 w-4" />
                Create your first group
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {memberships.map(({ group, role }) => {
                const isOwner = role === "owner";
                const isAdmin = role === "admin";

                return (
                  <div
                    key={group.id}
                    className="group relative overflow-hidden rounded-2xl border border-[#e4e0d7] bg-white shadow-[0_2px_10px_rgba(34,38,31,0.03)] transition duration-200 hover:-translate-y-0.5 hover:border-[#c9d8cc] hover:shadow-[0_8px_25px_rgba(34,38,31,0.07)]"
                  >
                    {/* Card accent */}
                    <div
                      className={`h-1.5 ${
                        isOwner
                          ? "bg-[#3e5c46]"
                          : "bg-[#b08a3e]"
                      }`}
                    />

                    <div className="p-5">
                      {/* Card top */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                              isOwner
                                ? "bg-[#e8f3eb] text-[#2e4636]"
                                : "bg-[#f7ecd5] text-[#a07828]"
                            }`}
                          >
                            {isOwner ? (
                              <Crown className="h-5 w-5" />
                            ) : (
                              <Users className="h-5 w-5" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate text-base font-bold capitalize text-[#22261f]">
                              {group.name}
                            </h3>

                            <p className="mt-1 text-xs text-[#777b72]">
                              {formatCurrency(
                                group.contributionAmount
                              )}{" "}
                              <span className="mx-1">•</span>{" "}
                              {formatFrequency(group)}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                            isOwner || isAdmin
                              ? "bg-[#e9f5ed] text-[#2e7d4f]"
                              : "bg-[#f1efe8] text-[#666960]"
                          }`}
                        >
                          {role}
                        </span>
                      </div>

                      {/* Description */}
                      {group.description ? (
                        <p className="mt-5 line-clamp-2 text-sm leading-6 text-[#667065]">
                          {group.description}
                        </p>
                      ) : (
                        <p className="mt-5 text-sm text-[#9a9d95]">
                          Thrift savings group
                        </p>
                      )}

                      {/* Divider */}
                      <div className="my-5 border-t border-[#ece8dc]" />

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-[#8b8e86]">
                            Member capacity
                          </p>

                          <div className="mt-1 flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-[#3e5c46]" />
                            <p className="text-sm font-bold text-[#22261f]">
                              {group.memberCap}
                            </p>
                            <span className="text-xs text-[#8b8e86]">
                              members
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-[#8b8e86]">
                            Contribution
                          </p>

                          <p className="mt-1 text-sm font-bold text-[#22261f]">
                            {formatCurrency(
                              group.contributionAmount
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-5 flex items-center gap-3">
                        <Link
                          href={`/group/${group.id}`}
                          className="flex-1 rounded-lg border border-[#b9c7bc] px-4 py-2.5 text-center text-sm font-semibold text-[#3e5c46] transition hover:bg-[#f5f8f5]"
                        >
                          View details
                        </Link>

                        <Link
                          href={`/group/${group.id}`}
                          className="flex-1 rounded-lg bg-[#3e5c46] px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#2e4636]"
                        >
                          {isOwner || isAdmin
                            ? "Manage group"
                            : "Open group"}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Create another group */}
        {memberships.length > 0 && (
          <Link
            href="/group/new"
            className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#cfc9ba] bg-white px-6 py-8 text-center transition hover:border-[#9fb2a4] hover:bg-[#fbfcfa]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e8f3eb] text-[#3e5c46]">
              <UserPlus className="h-5 w-5" />
            </div>

            <p className="mt-3 text-sm font-bold text-[#3e5c46]">
              Create a new thrift group
            </p>

            <p className="mt-1 text-xs text-[#777b72]">
              Start another group and grow together with your circle.
            </p>

            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#3e5c46]">
              Get started
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        )}
      </main>
    </div>
  )
}