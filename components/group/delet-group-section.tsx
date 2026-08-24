"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteGroup } from "@/app/(dashboard)/group/[groupId]/settings/action";
import { Button } from "../ui/button";

export function DeleteGroupSection({
  groupId,
  groupName,
}: {
  groupId: string;
  groupName: string;
}) {
;
  const router = useRouter()
  const [open, setOpen] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    const result = await deleteGroup(groupId);
    setLoading(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.push("/group");
  }

  if (!open) {
    return (
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
        Delete group
      </Button>
    );
  }

  return (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" id="delete-group">
      <div className="w-full max-w-sm rounded-xl bg-white p-6">
        <h3 className="text-base font-semibold text-neutral-900">
          Delete &quot;{groupName}&quot;?
        </h3>
        <p className="mt-2 text-sm text-neutral-500">
          This permanently deletes the group, its members, cycles, and
          contribution records. This can&apos;t be undone.
        </p>
        <p className="mt-3 text-sm text-neutral-700">
          Type <span className="font-semibold">{groupName}</span> to confirm.
        </p>
        <input
          value={confirmationMessage}
          onChange={(e) => setConfirmationMessage(e.target.value)}
          className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={confirmationMessage !== groupName || loading}
            className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Delete permanently"}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setConfirmationMessage("");
            }}
            disabled={loading}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}