import { WebSocketServer, WebSocket } from "ws";
import { notificationsHistory } from "../../mocks/mockUpsAlert";

export function broadcastNotification(wss: WebSocketServer){
    const payload = JSON.stringify({
        type: "newsNotification",
        data: notificationsHistory
    })

    wss.clients.forEach((client:any) => {
        if(client.readyState === WebSocket.OPEN){
            client.send(payload)
        }
    });
}

export function handlerNewsSocketConnection(socket: WebSocket, wss: WebSocketServer){
    console.info("Client connected to socket");

  socket.send(
    JSON.stringify({
        type: "CONNECTED",
        message: "Conection success",
    })
  );

  socket.on("message", (message) => {
    if(message){
      broadcastNotification(wss)
    }
    console.info("Message form client", message.toString());
  });

  socket.on("close", () => {
    console.info("Client desconected");
  });
}