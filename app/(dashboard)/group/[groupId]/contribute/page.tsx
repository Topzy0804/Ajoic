import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getAuthedUser } from "@/lib/get-user";
import { db } from "@/lib/db";
import { groups, groupMembers, cycles } from "@/lib/db/schema";
import { formatCurrency } from "@/lib/utils/format";
import { ReceiptUploadForm } from "@/components/group/receipt-upload-form";


const STATUS_COPY: Record<string, { label: string; tone: string; blurb: string }> = {
  pending: {
    label: "Not yet paid",
    tone: "bg-neutral-100 text-neutral-600",
    blurb: "Pay into the account below, then upload your receipt.",
  },
  submitted: {
    label: "Awaiting confirmation",
    tone: "bg-blue-50 text-blue-700",
    blurb: "Your receipt was submitted — the group admin will confirm it soon.",
  },
  paid: {
    label: "Paid",
    tone: "bg-green-50 text-green-700",
    blurb: "Confirmed — you're all set for this cycle.",
  },
  rejected: {
    label: "Receipt rejected",
    tone: "bg-red-50 text-red-700",
    blurb: "The admin couldn't confirm your last receipt. Upload a new one below.",
  },
  late: {
    label: "Late",
    tone: "bg-amber-50 text-amber-700",
    blurb: "This cycle's deadline has passed.",
  },
};

export default async function ContributePage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const { authUser } = await getAuthedUser();

  const group = await db.query.groups.findFirst({ where: eq(groups.id, groupId) });

  if (!group) notFound();

  const membership = await db.query.groupMembers.findFirst({
    where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, authUser.id)),
  });

  if (!membership || membership.status !== "active") notFound();

  const activeCycle = await db.query.cycles.findFirst({
    where: and(eq(cycles.groupId, groupId), eq(cycles.payoutStatus, "pending")),
    with: {
      contributions: true,
      recipient: { with: { user: true } },
    },
    orderBy: (c, { desc }) => desc(c.cycleNumber),
  });

  const contributionHistory = await db.query.cycles.findMany({
    where: eq(cycles.groupId, groupId),
    with: { contributions: true },
    orderBy: (c, { desc }) => desc(c.cycleNumber),
  });

  if (!activeCycle) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">
        There is no active cycle for this group right now.
      </div>
    );
  }

  const myContribution = activeCycle.contributions.find(
    (c) => c.groupMemberId === membership.id
  );

  if (!myContribution) notFound();

  const statusInfo = STATUS_COPY[myContribution.status];
  const canUpload = myContribution.status === "pending" || myContribution.status === "rejected";
  const formattedDueDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${activeCycle.endDate}T00:00:00`));

  return (
    <div className="mx-auto max-w-md pb-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Cycle {activeCycle.cycleNumber}
        </p>
        <h1 className="mt-1 text-xl font-semibold text-neutral-900">Your contribution is due</h1>
      </header>

      <section className="mt-5 border border-neutral-300 bg-white p-4">
        <div className="border-b border-neutral-300 pb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            Contribution
          </p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-lg font-semibold text-neutral-900">{formatCurrency(myContribution.amount)}</p>
            <span className={`text-xs font-medium ${statusInfo.tone}`}>{statusInfo.label}</span>
          </div>
          <p className="mt-2 text-xs text-neutral-500">Due {formattedDueDate}</p>
        </div>
        <p className="pt-3 text-xs leading-5 text-neutral-500">{statusInfo.blurb}</p>
        {myContribution.status === "rejected" && myContribution.rejectionReason && (
          <p className="mt-2 bg-red-50 px-3 py-2 text-xs text-red-700">
            Reason: {myContribution.rejectionReason}
          </p>
        )}
      </section>

      {canUpload && group.paymentMethod === "offline" && (
        <>
          <section className="mt-4 border border-neutral-300 bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center bg-neutral-900 text-[11px] font-semibold text-white">1</span>
              <h2 className="text-sm font-semibold text-neutral-900">Make payment</h2>
            </div>
            <p className="text-sm font-medium text-neutral-900">{group.payoutBankName}</p>
            <p className="mt-1 text-xs text-neutral-500">{group.payoutAccountName}</p>
            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-neutral-600">
              <span className="truncate">{group.payoutAccountNumber}</span>
              <span className="shrink-0 text-neutral-400">Copy</span>
            </div>
          </section>

          <section className="mt-4 border border-neutral-300 bg-white p-4">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center bg-neutral-900 text-[11px] font-semibold text-white">2</span>
              <h2 className="text-sm font-semibold text-neutral-900">Upload payment receipt</h2>
            </div>
            <ReceiptUploadForm groupId={groupId} contributionId={myContribution.id} />
          </section>
        </>
      )}

      <section className="mt-6 border-t border-neutral-300 pt-4">
        <h2 className="text-xs font-semibold text-neutral-900">Contribution history</h2>
        <ul className="mt-3 divide-y divide-neutral-200 border-y border-neutral-200">
          {contributionHistory.map((cycle) => {
            const contribution = cycle.contributions.find((item) => item.groupMemberId === membership.id);
            if (!contribution) return null;
            return (
              <li key={cycle.id} className="flex items-center justify-between py-3 text-xs">
                <span className="text-neutral-700">Cycle {cycle.cycleNumber}</span>
                <span className="text-neutral-600">{formatCurrency(contribution.amount)}</span>
                <span className="capitalize text-neutral-500">{contribution.status}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}