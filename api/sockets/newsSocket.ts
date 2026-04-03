import { WebSocketServer, WebSocket } from "ws";
import NewsServices from "../services/newsServices";

export async function broadcastNotification(wss: WebSocketServer) {
  const { error, data } = await NewsServices.getAllNews();

  if (error) {
    console.error("No se pudieron emitir las alertas por socket");
    return;
  }

  const payload = JSON.stringify({
    type: "newsNotification",
    data,
  });

  wss.clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

export function startNewsBroadcastScheduler(
  wss: WebSocketServer,
  intervalMs = 3 * 60 * 1000
) {
  setInterval(() => {
    console.log("Enviando notificaciones")
    void broadcastNotification(wss);
  }, intervalMs);
}

export function handlerNewsSocketConnection(
  socket: WebSocket,
  wss: WebSocketServer
) {
  console.info("Client connected to socket");

  socket.send(
    JSON.stringify({
      type: "CONNECTED",
      message: "Conection success",
    })
  );

  socket.on("message", (message) => {
    if (message) {
      void broadcastNotification(wss);
    }
    console.info("Message form client", message.toString());
  });

  socket.on("close", () => {
    console.info("Client desconected");
  });
}
