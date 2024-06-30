import { Router } from "express"
const router = Router()
import AlertsControllers from "../controllers/alertsControllers"

router.get('/', AlertsControllers.allAlerts)

export default router