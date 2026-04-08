import { WebSocketServer, WebSocket } from "ws";
import NewsServices from "../services/newsServices";
import PushTokenServices from "../services/pushTokenServices";

type AlertPayload = {
  Title: string;
  Tier: number;
  Tone: number;
  MediaType: number;
  Media: string;
  Section: string;
  Link: string;
  ConsultasId: number;
  NoticiaId: number;
};

type PushTokenRecord = {
  token: string;
};

type ExpoPushTicket = {
  details?: {
    error?: string;
    expoPushToken?: string;
  };
};

type ExpoPushResponse = {
  data?: ExpoPushTicket[];
};

function getNotificationIcon(mediaType: number) {
  switch (mediaType) {
    case 1:
      return "📰";
    case 2:
      return "📱";
    case 3:
      return "🖥️";
    case 4:
      return "🎙️";
    default:
      return "⚪";
  }
}

function getMediaTypeLabel(mediaType: number) {
  switch (mediaType) {
    case 1:
      return "Gráfica";
    case 2:
      return "Digital";
    case 3:
      return "TV";
    case 4:
      return "Radio";
    default:
      return "Medio";
  }
}

function mapAlertToFrontendPayload(alert: AlertPayload) {
  return {
    url: `/news/${alert.NoticiaId}`,
    params: {
      id: alert.NoticiaId,
      consultasId: alert.ConsultasId,
    },
    NoticiaId: alert.NoticiaId,
    ConsultasId: alert.ConsultasId,
    Titulo: alert.Title,
    Resumen: alert.Title,
    TipoMedioId: alert.MediaType,
    TipoMedio: getMediaTypeLabel(alert.MediaType),
    Soporte: alert.Media,
    Division: alert.Section,
    Tier: alert.Tier,
    Tono: alert.Tone,
    LinkImagen: "",
    LinkNoticia: alert.Link,
  };
}

async function sendExpoNotifications(alerts: AlertPayload[]) {
  const { error, data } = await PushTokenServices.getAllTokens();

  if (error) {
    console.error("No se pudieron obtener los Expo push tokens");
    return;
  }

  const recipients = (data as PushTokenRecord[])
    .map((item) => item.token)
    .filter(Boolean);

  if (recipients.length === 0) {
    console.info("No hay Expo push tokens registrados");
    return;
  }

  const messages = recipients.flatMap((token) =>
    alerts.map((alert) => {
      const payload = mapAlertToFrontendPayload(alert);

      return {
        to: token,
        title: `${getNotificationIcon(alert.MediaType)} ${payload.Titulo}`,
        body: payload.Resumen,
        sound: "default",
        channelId: "default",
        data: payload,
      };
    })
  );

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  });

  const responseData = (await response.json()) as ExpoPushResponse;
  const invalidTokens:any = (responseData.data ?? [])
    .filter((item) => item?.details?.error === "DeviceNotRegistered")
    .map((item) => item?.details?.expoPushToken)
    .filter(Boolean);

  if (invalidTokens.length > 0) {
    await PushTokenServices.deleteTokens(invalidTokens);
  }

  if (!response.ok) {
    console.error("Expo push service error", responseData);
  }
}

async function getAlertsForDelivery() {
  const { error, data } = await NewsServices.getAllNews();

  if (error) {
    console.error("No se pudieron obtener las alertas para envío");
    return null;
  }

  return data as AlertPayload[];
}

export async function dispatchPushNotifications() {
  const alerts = await getAlertsForDelivery();

  if (!alerts) {
    return;
  }

  await sendExpoNotifications(alerts);
}

export async function broadcastSocketNotifications(wss: WebSocketServer) {
  const alerts = await getAlertsForDelivery();

  if (!alerts) {
    return;
  }

  const payload = JSON.stringify({
    type: "newsNotification",
    data: alerts,
  });

  wss.clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

export function startNewsBroadcastScheduler(
  intervalMs = 3 * 60 * 1000
) {
  setInterval(() => {
    console.log("Enviando notificaciones push");
    void dispatchPushNotifications();
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
      void broadcastSocketNotifications(wss);
    }
    console.info("Message form client", message.toString());
  });

  socket.on("close", () => {
    console.info("Client desconected");
  });
}
