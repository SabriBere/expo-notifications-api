import express from "express"
import { Request, Response } from "express"
import { prisma } from "./config/db"
import { config } from "dotenv"
//llamado de las los end points, index
import routes from './rotes/index'
import morgan from "morgan"
import cors from "cors"
config({ path: `./.env.${process.env.NEDE_ENV}`})

const server = express()

morgan.token("date", (req:Request, res:Response) => {
    const date = new Date();
    const localDate = date.setTime(
        date.getTime() - date.getTimezoneOffset() * 60000
    )
    return new Date(localDate).toISOString();
})

const customMorgan = ':remote-addr - :remote-user [:date] ":method :url HTTP/:http-version" :status :res[content-length]';

server.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : customMorgan))

server.use(express.json());
server.use(cors());

server.use('/api', routes); //cuando tenga los endpoints


//cuando tenga la conexión a la DB, sincronizar
server.listen(process.env.PORT, async () => {
    console.log("Escuchando en el puerto", process.env.PORT);
    try {
        await prisma.$connect();
        console.log("Conexión a la base de datos establecida con éxito");
    } catch (error) {
        console.log("Error al levantar servidor:", error);
    }
});

