"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { changeMembershipRole, moveMemberPosition } from "@/app/(dashboard)/group/[groupId]/settings/action";


type Member = {
  id: string;
  role: "owner" | "admin" | "member";
  position: number;
  user: { fullName: string };
};

export function MemberManagementList({
  groupId,
  members,
  isOwner,
}: {
  groupId: string;
  members: Member[];
  isOwner: boolean;
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleMove(memberId: string, direction: "up" | "down") {
    setLoadingId(memberId);
    setError(null);

    const result = await moveMemberPosition(groupId, memberId, direction);
    setLoadingId(null);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleRoleToggle(memberId: string, currentRole: string) {
    setLoadingId(memberId);
    setError(null);

    const newRole = currentRole === "admin" ? "member" : "admin";

    const result = await changeMembershipRole(groupId, memberId, newRole);
    setLoadingId(null);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
        {members.map((member, idx) => (
          <li key={member.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex flex-col leading-none">
                <button
                  type="button"
                  onClick={() => handleMove(member.id, "up")}
                  disabled={idx === 0 || loadingId === member.id}
                  aria-label="Move up"
                  className="text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(member.id, "down")}
                  disabled={idx === members.length - 1 || loadingId === member.id}
                  aria-label="Move down"
                  className="text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
                >
                  ▼
                </button>
              </div>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium text-neutral-600">
                {member.position}
              </span>
              <span className="text-sm text-neutral-800">{member.user.fullName}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium capitalize text-neutral-600">
                {member.role}
              </span>
              {isOwner && member.role !== "owner" && (
                <button
                  type="button"
                  onClick={() => handleRoleToggle(member.id, member.role)}
                  disabled={loadingId === member.id}
                  className="text-xs font-medium text-green-700 underline disabled:opacity-50"
                >
                  {member.role === "admin" ? "Remove admin" : "Make admin"}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}