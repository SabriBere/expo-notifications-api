import { Router } from "express";
const router = Router();
import newsSocket from "./news";
import pushTokens from "./pushTokens";

router.use("/news", newsSocket);
router.use("/push-tokens", pushTokens);

export default router;
