import express from "express"
// import { Request, Response } from "express"
// import { prisma } from "./config/db"
import { config } from "dotenv"
import { WebSocketServer, WebSocket } from "ws";
import cors from "cors"
import http from "http";
config({ path: `./.env.${process.env.NODE_ENV}`})
//llamado de las los end points, index

const server = express()

server.use(express.json());
server.use(cors());

server.get("/health", (_req, res) => {
  res.json({ ok: true, message: "Server running" });
});

const httpServer = http.createServer(server);

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (socket: WebSocket) => {
  console.log("Client connected to socket");

  socket.send(
    JSON.stringify({
      type: "CONNECTED",
      message: "Conection success",
    })
  );

  socket.on("close", () => {
    console.log("Client desconected");
  });

  socket.on("message", (message) => {
    console.log("Message form client", message.toString());
  });
});

const PORT = Number(process.env.SOCKET_PORT);
//socket
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Escuchando socket en 0.0.0.0:${PORT}`);
});

