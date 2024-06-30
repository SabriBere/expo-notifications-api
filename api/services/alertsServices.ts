import { prisma } from "../config/db"

class AlertsService {
    static async searchAllAlerts(){
        const alerts = await prisma.alerts.findMany()

        if(!alerts){
            return {
                status: 400, error: false, data: "No hay alertas generadas"
            }
        }

        return { status: 201, error: false, data: alerts }
    }

}

export default AlertsService