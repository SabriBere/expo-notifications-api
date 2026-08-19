import { WebSocketServer, WebSocket } from "ws";
import NotificationServices from "../services/notificationServices";
import PushDeliveryServices from "../services/pushDeliveryServices";
import PushTokenServices from "../services/pushTokenServices";

type DemoNotification = {
  id: number;
  itemId: number;
  contextId: number;
  title: string;
  sourceType: string;
  source: string;
  category: string;
  link: string;
};

type PushTokenRecord = {
  id: number;
  token: string;
};

type ExpoPushTicket = {
  status?: "ok" | "error";
  details?: {
    error?: string;
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

  const recipients = (data as PushTokenRecord[]).filter((item) => item.token);

  if (recipients.length === 0) {
    console.info("No Expo push tokens are registered");
    return;
  }

  const claimedDeliveries: Array<{
    notification: DemoNotification;
    recipient: PushTokenRecord;
  }> = [];

  for (const recipient of recipients) {
    for (const notification of notifications) {
      if (await PushDeliveryServices.claim(notification.id, recipient.id)) {
        claimedDeliveries.push({ notification, recipient });
      }
    }
  }

  if (claimedDeliveries.length === 0) {
    console.info("No pending push notifications to deliver");
    return;
  }

  const messages = claimedDeliveries.map(({ notification, recipient }) => ({
    to: recipient.token,
    title: `${getNotificationIcon(notification.sourceType)} ${notification.title}`,
    body: `${notification.source} · ${notification.category}`,
    sound: "default",
    channelId: "default",
    data: toPushData(notification),
  }));

  let response: Response;
  try {
    response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });
  } catch {
    await Promise.all(
      claimedDeliveries.map(({ notification, recipient }) =>
        PushDeliveryServices.release(notification.id, recipient.id)
      )
    );
    console.error("Expo push request failed");
    return;
  }

  const responseData = (await response.json()) as ExpoPushResponse;
  const tickets = responseData.data ?? [];

  if (!response.ok) {
    await Promise.all(
      claimedDeliveries.map(({ notification, recipient }) =>
        PushDeliveryServices.release(notification.id, recipient.id)
      )
    );
    console.error("Expo push service error", { status: response.status });
    return;
  }

  const invalidTokenIds = new Set<number>();

  await Promise.all(
    claimedDeliveries.map(async ({ notification, recipient }, index) => {
      const ticket = tickets[index];

      if (ticket?.status === "ok") {
        await PushDeliveryServices.markDelivered(notification.id, recipient.id);
        return;
      }

      if (ticket?.details?.error === "DeviceNotRegistered") {
        invalidTokenIds.add(recipient.id);
        return;
      }

      await PushDeliveryServices.release(notification.id, recipient.id);
    })
  );

  if (invalidTokenIds.size > 0) {
    await PushTokenServices.deleteTokensById([...invalidTokenIds]);
  }
}

async function getNotificationsForDelivery() {
  const { error, data } = await NotificationServices.getAllNotifications();

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
  let isDispatchRunning = false;

  setInterval(async () => {
    if (isDispatchRunning) {
      console.warn("Skipping overlapping notification scheduler run");
      return;
    }

    isDispatchRunning = true;
    console.log("Sending demo push notifications");
    try {
      await dispatchPushNotifications();
    } catch {
      console.error("Notification scheduler run failed");
    } finally {
      isDispatchRunning = false;
    }
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
    console.info("Message received from notification socket client");
  });

  socket.on("close", () => {
    console.info("Client disconnected from notification socket");
  });
}
