import express from "express"
import { Request, Response } from "express"
import { prisma } from "./config/db"
import { config } from "dotenv"
import { createServer } from "http";
import WebSocket, { WebSocketServer } from "ws";
import routes from './rotes/index'
import morgan from "morgan"
import cors from "cors"
import axios from "axios"

config({ path: `./.env.${process.env.NEDE_ENV}`})

const app = express()
const server = createServer(app)

morgan.token("date", (req:Request, res:Response) => {
    const date = new Date();
    const localDate = date.setTime(
        date.getTime() - date.getTimezoneOffset() * 60000
    )
    return new Date(localDate).toISOString();
})

const customMorgan = ':remote-addr - :remote-user [:date] ":method :url HTTP/:http-version" :status :res[content-length]';

app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : customMorgan))
app.use(express.json());
app.use(cors());
app.use('/api', routes); //cuando tenga los endpoints


const socket = new WebSocketServer({ server })

const clients: Set<WebSocket> = new Set()

socket.on('connection', (ws) => {
    console.log('Cliente conectado')
    clients.add(ws)

    ws.on('message', (message) => {
        console.log('Recibiendo mensajes del cliente', message)
        //Y acá puedo recibir los mensajes de los distintos clientes
    })

    ws.on('close', () => {
        console.log('Cliente desconectado')
        clients.delete(ws)
    })
})


server.listen(process.env.PORT, async () => {
    console.log("Escuchando en el puerto", process.env.PORT);

    //Esta función simula el servicio de python que crea alertas cuando se levanta el servidor
    async function generateAlerts() {
        try {
            //Genera las alertas, le pega al end point de create
            await axios.post(
                `${process.env.API_URL}/alerts/one`,
            );
            //Consulta las alertas creadas y las envia, le pega al end point
            const res = await axios.get(
                `${process.env.API_URL}/alerts/`,
            );
            
            const alertData = res.data.data
            broadcastAlert(alertData)
        } catch (error: any) {
            console.error(`Error - Code: ${error.code}, Message: ${error.message}`);
            throw error;
        }
    }
    await generateAlerts()
    try {
        await prisma.$connect();
        console.log("Conexión a la base de datos establecida con éxito");
    } catch (error) {
        console.log("Error al levantar servidor:", error);
    }

    // Ejecutar generateAlerts cada 2 minutos (120,000 milisegundos)
    setInterval(generateAlerts, 120000); // 2 minutos = 120,000 milisegundos
});

function broadcastAlert(alert: any) {
    clients.forEach((client:any) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(alert))
        }
    })
}

