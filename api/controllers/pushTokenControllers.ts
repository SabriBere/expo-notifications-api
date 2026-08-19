import { Request, Response } from "express";
import PushTokenServices from "../services/pushTokenServices";

class PushTokenControllers {
  static async registerToken(req: Request, res: Response) {
    const token = req.body?.token;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ data: "token is required" });
    }

    const normalizedToken = token.trim();
    const { Expo } = await import("expo-server-sdk");
    if (!Expo.isExpoPushToken(normalizedToken)) {
      return res.status(400).json({ data: "invalid Expo push token" });
    }

    console.info("Registering Expo push token");

    const { status, error, data } =
      await PushTokenServices.registerToken(normalizedToken);

    if (error) {
      return res.status(status).json({ data });
    }

    return res.status(200).json({ data: { registered: true } });
  }
}

export default PushTokenControllers;
