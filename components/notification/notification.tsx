"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { markNotificationRead, markAllNotificationsRead } from "@/app/(dashboard)/notification/action";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: string; 
  groupId: string | null;
};

const TYPE_LINK: Record<string, (groupId: string) => string> = {
  cycle_started: (g) => `/group/${g}/contribute`,
  receipt_submitted: (g) => `/group/${g}/review`,
  receipt_confirmed: (g) => `/group/${g}/contribute`,
  receipt_rejected: (g) => `/group/${g}/contribute`,
  member_joined: (g) => `/group/${g}/settings`,
  role_changed: (g) => `/group/${g}/settings`,
  contribution_due: (g) => `/group/${g}/contribute`,
};

export function NotificationList({
  notifications,
  hasUnread,
}: {
  notifications: NotificationItem[];
  hasUnread: boolean;
}) {
  const router = useRouter();

  async function handleClick(n: NotificationItem) {
    if (!n.read) {
      await markNotificationRead(n.id);
      router.refresh();
    }
  }

  async function handleMarkAll() {
    await markAllNotificationsRead();
    router.refresh();
  }

  if (notifications.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
        No notifications yet.
      </div>
    );
  }

  return (
    <div>
      {hasUnread && (
        <div className="mb-3 flex justify-end">
          <button
            onClick={handleMarkAll}
            className="text-sm font-medium text-green-700 underline"
          >
            Mark all as read
          </button>
        </div>
      )}
      <ul className="flex flex-col gap-2">
        {notifications.map((n) => {
          const href = n.groupId ? TYPE_LINK[n.type]?.(n.groupId) : undefined;
          const content = (
            <div
              className={`rounded-lg border px-4 py-3 transition ${
                n.read
                  ? "border-neutral-200 bg-white"
                  : "border-green-200 bg-green-50 hover:bg-green-100"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p
                  className={`text-sm ${n.read ? "text-neutral-700" : "font-medium text-neutral-900"}`}
                >
                  {n.title}
                </p>
                {!n.read && (
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-green-600" />
                )}
              </div>
              {n.body && <p className="mt-1 text-sm text-neutral-500">{n.body}</p>}
              <p className="mt-1 text-xs text-neutral-400">
                {new Date(n.createdAt).toLocaleString("en-NG", {
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          );

          return (
            <li key={n.id} onClick={() => handleClick(n)}>
              {href ? (
                <Link href={href}>{content}</Link>
              ) : (
                <div className="cursor-pointer">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}