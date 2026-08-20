"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startCycle } from "@/app/(dashboard)/group/[groupId]/action";
import { Button } from "@/components/ui/button";

export function StartCycleButton({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setLoading(true);
    setError(null);

    const result = await startCycle(groupId);

    setLoading(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  return (
     <div>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <Button
        onClick={handleStart}
        disabled={loading}
        className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-800 disabled:opacity-60"
      >
        {loading ? "Starting..." : "Start cycle"}
      </Button>
    </div>
  )
}