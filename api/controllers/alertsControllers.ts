import { Response, Request } from "express"
import AlertsService from "../services/alertsServices"

class AlertsControllers {
    static async allAlerts(req: Request, res:Response){

        const { status, error, data } = await AlertsService.searchAllAlerts()

        if(error){
            if(status === 400){
                return res.status(400).json({ data })
            } else {
                return res.status(500).json({ data })
            }
        }
        res.status(201).json({ data })
    }
}

export default AlertsControllers


