import { Router } from "express"
const router = Router()
import routersAlerts from './alerts'

router.use("/alerts", routersAlerts)


export default router;