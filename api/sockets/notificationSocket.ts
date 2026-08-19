import { WebSocketServer, WebSocket } from "ws";
import NotificationServices from "../services/notificationServices";
import PushTokenServices from "../services/pushTokenServices";

type DemoNotification = {
  itemId: number;
  contextId: number;
  title: string;
  sourceType: string;
  source: string;
  category: string;
  link: string;
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

function getNotificationIcon(sourceType: string) {
  switch (sourceType) {
    case "web":
      return "🌐";
    case "system":
      return "⚙️";
    case "email":
      return "✉️";
    case "collaboration":
      return "👥";
    default:
      return "🔔";
  }
}

function toPushData(notification: DemoNotification) {
  return {
    itemId: notification.itemId,
    contextId: notification.contextId,
    url: `/demo-items/${notification.itemId}`,
  };
}

async function sendExpoNotifications(notifications: DemoNotification[]) {
  const { error, data } = await PushTokenServices.getAllTokens();

  if (error) {
    console.error("Could not load Expo push tokens");
    return;
  }

  const recipients = (data as PushTokenRecord[])
    .map((item) => item.token)
    .filter(Boolean);

  if (recipients.length === 0) {
    console.info("No Expo push tokens are registered");
    return;
  }

  const messages = recipients.flatMap((token) =>
    notifications.map((notification) => ({
      to: token,
      title: `${getNotificationIcon(notification.sourceType)} ${notification.title}`,
      body: `${notification.source} · ${notification.category}`,
      sound: "default",
      channelId: "default",
      data: toPushData(notification),
    }))
  );

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  });

  const responseData = (await response.json()) as ExpoPushResponse;
  const invalidTokens = (responseData.data ?? [])
    .filter((item) => item?.details?.error === "DeviceNotRegistered")
    .map((item) => item?.details?.expoPushToken)
    .filter((token): token is string => Boolean(token));

  if (invalidTokens.length > 0) {
    await PushTokenServices.deleteTokens(invalidTokens);
  }

  if (!response.ok) {
    console.error("Expo push service error", responseData);
  }
}

async function getNotificationsForDelivery() {
  const { error, data } =
    await NotificationServices.getAllNotifications();

  if (error) {
    console.error("Could not load demo notifications for delivery");
    return null;
  }

  return data as DemoNotification[];
}

export async function dispatchPushNotifications() {
  const notifications = await getNotificationsForDelivery();

  if (!notifications) return;

  await sendExpoNotifications(notifications);
}

export async function broadcastSocketNotifications(wss: WebSocketServer) {
  const notifications = await getNotificationsForDelivery();

  if (!notifications) return;

  const payload = JSON.stringify({
    type: "notificationBatch",
    data: notifications,
  });

  wss.clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

export function startNotificationScheduler(intervalMs = 3 * 60 * 1000) {
  setInterval(() => {
    console.log("Sending demo push notifications");
    void dispatchPushNotifications();
  }, intervalMs);
}

export function handleNotificationSocketConnection(
  socket: WebSocket,
  wss: WebSocketServer
) {
  console.info("Client connected to notification socket");

  socket.send(
    JSON.stringify({
      type: "connected",
      message: "Notification demo socket connected",
    })
  );

  socket.on("message", (message) => {
    if (message) {
      void broadcastSocketNotifications(wss);
    }
    console.info("Message from client", message.toString());
  });

  socket.on("close", () => {
    console.info("Client disconnected from notification socket");
  });
}
