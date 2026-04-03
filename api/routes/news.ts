import { Router } from "express";
import NewsControllers from "../controllers/newsControllers";
const router = Router();

router.get("/getAll", NewsControllers.getNews);

export default router;
