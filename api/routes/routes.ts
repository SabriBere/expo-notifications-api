import { Router } from "express";
const router = Router();
import notifications from "./notifications";
import pushTokens from "./pushTokens";

router.use("/notifications", notifications);
router.use("/push-tokens", pushTokens);

export default router;
