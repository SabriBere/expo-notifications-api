import { Request, Response } from "express";
import NotificationServices from "../services/notificationServices";

class NotificationControllers {
  static async getNotifications(_req: Request, res: Response) {
    const { status, error, data } =
      await NotificationServices.getAllNotifications();

    if (error) {
      return res.status(status).json({ data });
    }

    return res.status(200).json({ data });
  }
}

export default NotificationControllers;
