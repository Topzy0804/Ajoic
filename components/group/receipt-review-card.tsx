"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils/format";
import { confirmReceipt, rejectReceipt } from "@/app/(dashboard)/group/[groupId]/review/action";

export function ReceiptReviewCard({
  contributionId,
  memberName,
  amount,
  receiptUrl,
  submittedAt,
}: {
  contributionId: string;
  memberName: string;
  amount: string;
  receiptUrl: string | null;
  submittedAt: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [reason, setReason] = useState("");

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    const result = await confirmReceipt(contributionId);
    setLoading(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleReject() {
    setLoading(true);
    setError(null);
    const result = await rejectReceipt(contributionId, reason);
    setLoading(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }
    setShowRejectInput(false);
    setReason("");
    router.refresh();
  }


  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-900">{memberName}</p>
          <p className="text-sm text-neutral-500">{formatCurrency(amount)}</p>
          {submittedAt && (
            <p className="mt-0.5 text-xs text-neutral-400">
              Submitted {new Date(submittedAt).toLocaleString("en-NG")}
            </p>
          )}
        </div>
        {receiptUrl && (
          <a
            href={receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-green-700 underline"
          >
            View receipt
          </a>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {!showRejectInput ? (
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-60"
          >
            {loading ? "Confirming..." : "Confirm"}
          </button>
          <button
            onClick={() => setShowRejectInput(true)}
            disabled={loading}
            className="flex-1 rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            Reject
          </button>
        </div>
      ) : (
        <div className="mt-3">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this being rejected? (shown to the member)"
            rows={2}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleReject}
              disabled={loading}
              className="flex-1 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {loading ? "Rejecting..." : "Confirm rejection"}
            </button>
            <button
              onClick={() => setShowRejectInput(false)}
              disabled={loading}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}