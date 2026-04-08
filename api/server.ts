import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import {
  handlerNewsSocketConnection,
  startNewsBroadcastScheduler,
} from "./sockets/newsSocket";
import cors from "cors";
import routes from "./routes/routes";

const server = express();
const HTTP_PORT = Number(process.env.PORT ?? 8000);
const SOCKET_PORT = Number(process.env.SOCKET_PORT ?? HTTP_PORT + 1);

server.use(express.json());
server.use(cors());
server.use("/", routes);

const wss = new WebSocketServer({ port: SOCKET_PORT });

wss.on("connection", (socket: WebSocket) => {
  handlerNewsSocketConnection(socket, wss);
});

startNewsBroadcastScheduler();

server.listen(HTTP_PORT, () => {
  console.log(`Escuchando backend HTTP en 0.0.0.0:${HTTP_PORT}`);
});

wss.on("listening", () => {
  console.log(`Escuchando backend WebSocket en 0.0.0.0:${SOCKET_PORT}`);
});
