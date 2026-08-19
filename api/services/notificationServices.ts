import { prisma } from "../config/db";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected database error";
}

class NotificationServices {
  static async getAllNotifications() {
    try {
      const notifications = await prisma.demoNotification.findMany({
        orderBy: {
          id: "asc",
        },
      });

      return { status: 200, error: false, data: notifications };
    } catch (error: unknown) {
      return { status: 500, error: true, data: getErrorMessage(error) };
    }
  }
}

export default NotificationServices;
