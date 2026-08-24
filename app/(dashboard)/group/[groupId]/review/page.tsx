import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getAuthedUser } from "@/lib/get-user";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { groups, groupMembers, cycles } from "@/lib/db/schema";
import { ReceiptReviewCard } from "@/components/group/receipt-review-card";

const SIGNED_URL_EXPIRY_SECONDS = 60 * 10

export default async function ReviewReceiptsPage({
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

  const isAdmin = membership?.role === "owner" || membership?.role === "admin";

  if (!isAdmin) notFound();

  const activeCycle = await db.query.cycles.findFirst({
    where: and(eq(cycles.groupId, groupId), eq(cycles.payoutStatus, "pending")),
    with: {
      contributions: { with: { member: { with: { user: true } } }
    },
    },
    orderBy: (c, { desc }) => desc(c.cycleNumber),
  });

  if (!activeCycle) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">
        No active cycle for this group.
      </div>
    );
  }

  const submitted = activeCycle.contributions.filter((c) => c.status === "submitted");

  const other = activeCycle.contributions.filter((c) => c.status !== "submitted");

  const supabase = await createClient();
  const submittedWithUrls = await Promise.all(
    submitted.map(async (c) => {

      if (!c.receiptUrl) return { ...c, signedUrl: null };

      const { data } = await supabase.storage
        .from("receipts")
        .createSignedUrl(c.receiptUrl, SIGNED_URL_EXPIRY_SECONDS);
      return { ...c, signedUrl: data?.signedUrl ?? null };
    })
  );

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-xl font-semibold text-neutral-900">
        Review receipts — Cycle {activeCycle.cycleNumber}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        {submitted.length} awaiting review
      </p>

      {submittedWithUrls.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">
          Nothing waiting on you right now.
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {submittedWithUrls.map((c) => (
            <ReceiptReviewCard
              key={c.id}
              contributionId={c.id}
              memberName={c.member.user.fullName}
              amount={c.amount}
              receiptUrl={c.signedUrl}
              submittedAt={c.submittedAt ? c.submittedAt.toISOString() : null}
            />
          ))}
        </div>
      )}

      {other.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-medium text-neutral-500">Other members</h2>
          <ul className="mt-2 rounded-xl border border-neutral-200 bg-white">
            {other.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between border-b border-neutral-100 px-4 py-2.5 text-sm last:border-b-0"
              >
                <span className="text-neutral-800">{c.member.user.fullName}</span>
                <span className="capitalize text-neutral-500">{c.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}