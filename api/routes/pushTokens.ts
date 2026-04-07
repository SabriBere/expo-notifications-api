import { Router } from "express";
import PushTokenControllers from "../controllers/pushTokenControllers";

const router = Router();

router.post("/register", PushTokenControllers.registerToken);

export default router;
