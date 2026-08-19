import { prisma } from "../config/db";

class NotificationServices {
  static async getAllNotifications() {
    try {
      const notifications = await prisma.demoNotification.findMany({
        orderBy: {
          id: "asc",
        },
      });

      return { status: 200, error: false, data: notifications };
    } catch (error: any) {
      return { status: 500, error: true, data: error.message };
    }
  }
}

export default NotificationServices;
