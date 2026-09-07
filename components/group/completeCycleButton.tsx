"use client";

import { useRouter } from "next/navigation";
import { completeCycle } from "@/app/(dashboard)/group/[groupId]/action";
import { useState } from "react";

export function CompleteCycleButton({
  groupId,
  cycleId,
  allPaid,
}: {
  groupId: string;
  cycleId: string;
  allPaid: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleComplete() {
    setLoading(true);
    setError(null);

    const result = await completeCycle(groupId, cycleId);

    setLoading(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  if (!allPaid) {
    return (
      <p className="text-xs text-neutral-400">
        Complete every member&apos;s contribution to close this cycle.
      </p>
    );
  }

  return (
    <div>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <button
        onClick={handleComplete}
        disabled={loading}
        className="rounded-md bg-green-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-60"
      >
        {loading ? "Completing..." : "Complete cycle & pay out"}
      </button>
    </div>
  )
}