import { Router } from "express"
const router = Router()
import AlertsControllers from "../controllers/alertsControllers"

router.get('/', AlertsControllers.allAlerts)

router.post('/one', AlertsControllers.createAlerts)

export default router