import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getAuthedUser } from "@/lib/get-user";
import { db } from "@/lib/db";
import { groups } from "@/lib/db/schema";
import { EditGroupForm } from "@/components/group/edit-group-form";
import { MemberManagementList } from "@/components/group/member-managemant-list";
import { DeleteGroupSection } from "@/components/group/delet-group-section";
import { SettingsNav } from "@/components/group/settings-nav";


export default async function GroupSettingsPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const { authUser } = await getAuthedUser();

  const group = await db.query.groups.findFirst({
    where: eq(groups.id, groupId),
    with: { members: { with: { user: true } } },
  });

  if (!group) notFound();

  const membership = group.members.find(
    (m) => m.userId === authUser.id && m.status === "active"
  );

  const isAdmin = membership?.role === "owner" || membership?.role === "admin";

  const isOwner = membership?.role === "owner";

  if (!isAdmin) notFound();

  const activeMembers = [...group.members]
    .filter((m) => m.status === "active")
    .sort((a, b) => a.position - b.position);

    const navItems = [
      { label: "General", href: "#general" },
      { label: "Contribution", href: "#contribution" },
      { label: "Payout account", href: "#payout-account" },
      { label: "Members", href: "#members" },
      { label: "Payout order", href: "#payout-order" },
      ...(isOwner ? [{ label: "Delete group", href: "#delete-group" }] : []),
    ];

    return (
      <div className="flex flex-col gap-6 lg:flex-row mx-auto max-w-6xl">
        <div className="hidden lg:block lg:w-64">
          <SettingsNav items={navItems} />
        </div>
      <div className="mx-auto max-w-2xl scroll-smooth">
            <h1 className="text-xl font-semibold text-neutral-900">Group settings</h1>
      
            <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
              <h2 className="text-sm font-medium text-neutral-900">Group details</h2>
              <div className="mt-4">
                <EditGroupForm groupId={group.id} group={group} />
              </div>
            </section>
      
            <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
              <h2 className="text-sm font-medium text-neutral-900">Members &amp; payout order</h2>
              <p className="mt-1 text-sm text-neutral-500">
                {isOwner
                  ? "Reorder the payout queue or change member roles."
                  : "Reorder the payout queue."}
              </p>
              <div className="mt-4">
                <MemberManagementList
                  groupId={group.id}
                  members={activeMembers}
                  isOwner={!!isOwner}
                />
              </div>
            </section>
      
            {isOwner && (
              <section className="mt-6 rounded-xl border border-red-200 bg-white p-6">
                <h2 className="text-sm font-medium text-red-700">Danger zone</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Deleting a group is permanent and removes all its data.
                </p>
                <div className="mt-4">
                  <DeleteGroupSection groupId={group.id} groupName={group.name} />
                </div>
              </section>
            )}
          </div>
          </div>
    )
}
