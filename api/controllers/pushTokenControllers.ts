import { Request, Response } from "express";
import PushTokenServices from "../services/pushTokenServices";

class PushTokenControllers {
  static async registerToken(req: Request, res: Response) {
    const token = req.body?.token;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ data: "token is required" });
    }

    console.info("Registering Expo push token", token);

    const { status, error, data } = await PushTokenServices.registerToken(token);

    if (error) {
      return res.status(status).json({ data });
    }

    return res.status(200).json({ data });
  }
}

export default PushTokenControllers;
