import { Router } from "express";
const router = Router();
import newsSocket from "./news";

router.use("/news", newsSocket);

export default router;
