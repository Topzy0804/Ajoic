"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { joinGroup } from "@/app/(dashboard)/group/[groupId]/join/action";
import { Button } from "@/components/ui/button";


export function JoinGroupButton({ groupId }: { groupId: string })
{
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    setLoading(true);
    setError(null);

    const result = await joinGroup(groupId);

    setLoading(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    router.push(`/group/${groupId}`);
  }

  return (
    <div>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <Button
        onClick={handleJoin}
        disabled={loading}
        className="w-full rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-800 disabled:opacity-60"
      >
        {loading ? "Joining..." : "Join group"}
      </Button>
    </div>
  )
}