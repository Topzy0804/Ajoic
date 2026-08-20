"use client";

import { useState } from "react";

export function InviteLink({ groupId }: { groupId: string }) {
  const [copied, setCopied] = useState(false);

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/group/${groupId}/join`
      : "";

      async function handleCopy() {
        await navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }

      return (
        <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-sm font-medium text-neutral-900">Invite members</p>
      <p className="mt-1 text-sm text-neutral-500">
        Share this link so people can join the group.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <input
          readOnly
          value={inviteUrl}
          className="flex-1 rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-600"
        />
        <button
          onClick={handleCopy}
          className="whitespace-nowrap rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
      )
}