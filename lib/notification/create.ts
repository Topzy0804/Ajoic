import { db } from "@/lib/db";
import { notifications, type notificationTypeEnum } from "@/lib/db/schema";

type NotificationType = (typeof notificationTypeEnum.enumValues)[number];

type CreateNotificationInput = {
  userId: string;
  groupId: string;
  type: NotificationType;
  title: string;
  body?: string;
};

export async function createNotification(
  dbOrTx: Pick<typeof db, "insert">,
  input: CreateNotificationInput
) {
  await dbOrTx.insert(notifications).values({
    userId: input.userId,
    groupId: input.groupId,
    type: input.type,
    title: input.title,
    body: input.body,
  });
}

export async function createNotifications(
  dbOrTx: Pick<typeof db, "insert">,
  inputs: CreateNotificationInput[]
) {
  if (inputs.length === 0) return;
  await dbOrTx.insert(notifications).values(
    inputs.map((input) => ({
      userId: input.userId,
      groupId: input.groupId,
      type: input.type,
      title: input.title,
      body: input.body,
    }))
  );
}