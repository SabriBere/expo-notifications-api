import { prisma } from "../config/db"

class AlertsService {
    static async searchAllAlerts(){
        const alerts = await prisma.alerts.findMany()

        if(!alerts){
            return {
                status: 400, error: true, data: "No hay alertas generadas"
            }
        }

        return { status: 200, error: false, data: alerts }
    }
    
    static async addAlert(){
        const alertData = [
            { idSignal: 1108, signalName: 'AMRadioLaRed', text: "Gol de Lautaro Martinez", date: "2024-06-29", hour: "22:52:49" },
            { idSignal: 1103, signalName: 'AMRadioNacional', text: "Aguante fideo Di Maria", date: "2024-06-29", hour: "23:06:49" },
          ];
        

        const alertCreated = await prisma.$transaction(
            alertData.map((alert) => prisma.alerts.create({ data: alert }))
          );

        if(!alertCreated){
            return {
                status: 400, error: true, data: "Error al crear alerta"
            }
        }

        return { status: 200, error:false, data: alertCreated }
    }

}

export default AlertsService