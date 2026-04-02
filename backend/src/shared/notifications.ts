import logger from "./logger";

export type InAppNotificationInput = {
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
};

export const createInAppNotification = async (
  input: InAppNotificationInput,
): Promise<void> => {
  logger.info(
    {
      userId: input.userId,
      type: input.type,
      title: input.title,
      metadata: input.metadata ?? {},
    },
    "in_app_notification_created",
  );
};
