import { eq } from "drizzle-orm";
import { getAuthedUser } from "@/lib/get-user";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { NotificationList } from "@/components/notification/notification";

export default async function NotificationsPage() {
  const { authUser } = await getAuthedUser();

  const items = await db.query.notifications.findMany({
    where: eq(notifications.userId, authUser.id),
    orderBy: (n, { desc }) => desc(n.createdAt),
    limit: 50,
  });

  const hasUnread = items.some((n) => !n.read);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-xl font-semibold text-neutral-900">Notifications</h1>
      <div className="mt-4">
        <NotificationList
          notifications={items.map((n) => ({
            id: n.id,
            type: n.type,
            title: n.title,
            body: n.body,
            read: n.read,
            createdAt: n.createdAt.toISOString(),
            groupId: n.groupId,
          }))}
          hasUnread={hasUnread}
        />
      </div>
    </div>
  );
}