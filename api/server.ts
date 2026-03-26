import express from "express"
import { WebSocketServer, WebSocket } from "ws";
import { handlerNewsSocketConnection } from "./sockets/newsSocket";
import cors from "cors"
import http from "http";
import routes from "./routes/routes"

const server = express()

server.use(express.json());
server.use(cors());

//socket
const httpServer = http.createServer(server);
const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (socket: WebSocket) => {
  handlerNewsSocketConnection(socket, wss);
});

server.use("/", routes);

const PORT = Number(process.env.SOCKET_PORT);

httpServer.listen(PORT, () => {
  console.log(`Escuchando socket en 0.0.0.0:${PORT}`);
});

