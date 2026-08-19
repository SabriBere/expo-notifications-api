import { Router } from "express";
import NotificationControllers from "../controllers/notificationControllers";

const router = Router();

router.get("/", NotificationControllers.getNotifications);

export default router;
