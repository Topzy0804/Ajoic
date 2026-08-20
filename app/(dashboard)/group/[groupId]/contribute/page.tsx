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

if (!activeCycle) {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">
        There is no active cycle for this group right now.
      </div>
  )
}

const myContribution = activeCycle.contributions.find(
  (c) => c.groupMemberId === membership.id
);

if (!myContribution) notFound();

const statusInfo = STATUS_COPY[myContribution.status];
const canUpload = myContribution.status === "pending" || myContribution.status === "rejected";

return (
  <div className="mx-auto max-w-md">
        <h1 className="text-xl font-semibold text-neutral-900">Cycle {activeCycle.cycleNumber}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {activeCycle.recipient.user.fullName} collects this cycle
        </p>
  
        <div className="mt-5 rounded-xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-500">Your contribution</p>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo.tone}`}>
              {statusInfo.label}
            </span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">
            {formatCurrency(myContribution.amount)}
          </p>
          <p className="mt-2 text-sm text-neutral-500">{statusInfo.blurb}</p>
  
          {myContribution.status === "rejected" && myContribution.rejectionReason && (
            <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              Reason: {myContribution.rejectionReason}
            </p>
          )}
        </div>
  
        {canUpload && group.paymentMethod === "offline" && (
          <>
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-900">Pay into this account</p>
              <p className="mt-1 text-sm text-amber-800">
                {group.payoutAccountName} · {group.payoutAccountNumber} ·{" "}
                {group.payoutBankName}
              </p>
            </div>
  
            <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-5">
              <ReceiptUploadForm groupId={groupId} contributionId={myContribution.id} />
            </div>
          </>
        )}
      </div>
);
}