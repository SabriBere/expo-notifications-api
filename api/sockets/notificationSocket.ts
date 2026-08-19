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

type DemoDispatchResult = {
  sentCount: number;
  hasPending: boolean;
};

type SocketRequest = {
  type: "requestNotifications";
};

function sendSocketError(socket: WebSocket, code: string, message: string) {
  socket.send(JSON.stringify({ type: "error", code, message }));
}

function parseSocketRequest(rawMessage: string): SocketRequest | null {
  try {
    const payload: unknown = JSON.parse(rawMessage);

    if (
      typeof payload !== "object" ||
      payload === null ||
      !("type" in payload) ||
      payload.type !== "requestNotifications"
    ) {
      return null;
    }

    return { type: payload.type };
  } catch {
    return null;
  }
}

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
    return { sentCount: 0, hasPending: true };
  }

  const recipients = (data as PushTokenRecord[]).filter((item) => item.token);

  if (recipients.length === 0) {
    console.info("No Expo push tokens are registered");
    return { sentCount: 0, hasPending: false };
  }

  const claimedDeliveries: Array<{
    notification: DemoNotification;
    recipient: PushTokenRecord;
  }> = [];
  let hasPending = false;

  for (const recipient of recipients) {
    for (const [index, notification] of notifications.entries()) {
      if (await PushDeliveryServices.claim(notification.id, recipient.id)) {
        claimedDeliveries.push({ notification, recipient });
        hasPending ||= index < notifications.length - 1;
        break;
      }
    }
  }

  if (claimedDeliveries.length === 0) {
    console.info("No pending push notifications to deliver");
    return { sentCount: 0, hasPending: false };
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
    return { sentCount: 0, hasPending: true };
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
    return { sentCount: 0, hasPending: true };
  }

  const invalidTokenIds = new Set<number>();
  let sentCount = 0;
  let shouldRetry = false;

  await Promise.all(
    claimedDeliveries.map(async ({ notification, recipient }, index) => {
      const ticket = tickets[index];

      if (ticket?.status === "ok") {
        await PushDeliveryServices.markDelivered(notification.id, recipient.id);
        sentCount += 1;
        return;
      }

      if (ticket?.details?.error === "DeviceNotRegistered") {
        invalidTokenIds.add(recipient.id);
        return;
      }

      await PushDeliveryServices.release(notification.id, recipient.id);
      shouldRetry = true;
    })
  );

  if (invalidTokenIds.size > 0) {
    await PushTokenServices.deleteTokensById([...invalidTokenIds]);
  }

  return { sentCount, hasPending: hasPending || shouldRetry };
}

async function sendGenericExpoNotification() {
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

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      recipients.map((recipient) => ({
        to: recipient.token,
        title: "🔔 Notification demo is still running",
        body: "This generic notification is sent every 10 minutes.",
        sound: "default",
        channelId: "default",
        data: { url: "/notifications" },
      }))
    ),
  });

  const responseData = (await response.json()) as ExpoPushResponse;

  if (!response.ok) {
    console.error("Expo generic push service error", {
      status: response.status,
    });
    return;
  }

  const invalidTokenIds = recipients
    .filter(
      (_, index) =>
        responseData.data?.[index]?.details?.error === "DeviceNotRegistered"
    )
    .map((recipient) => recipient.id);

  if (invalidTokenIds.length > 0) {
    await PushTokenServices.deleteTokensById(invalidTokenIds);
  }

  console.info("Generic push notification sent");
}

async function getNotificationsForDelivery() {
  const { error, data } = await NotificationServices.getAllNotifications();

  if (error) {
    console.error("Could not load demo notifications for delivery");
    return null;
  }

  return data as DemoNotification[];
}

export async function dispatchPushNotifications(): Promise<DemoDispatchResult> {
  const notifications = await getNotificationsForDelivery();

  if (!notifications) return { sentCount: 0, hasPending: true };

  return sendExpoNotifications(notifications);
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
  const genericIntervalMs = 10 * 60 * 1000;
  let isDispatchRunning = false;
  let timer: NodeJS.Timeout;

  const schedule = (delayMs: number, sendGeneric: boolean) => {
    timer = setTimeout(() => void run(sendGeneric), delayMs);
  };

  const run = async (sendGeneric: boolean) => {
    if (isDispatchRunning) {
      console.warn("Skipping overlapping notification scheduler run");
      schedule(intervalMs, false);
      return;
    }

    isDispatchRunning = true;
    try {
      const result = await dispatchPushNotifications();

      if (result.sentCount > 0 || result.hasPending) {
        console.log("Sending next demo push notification in 3 minutes");
        schedule(intervalMs, false);
        return;
      }

      if (sendGeneric) {
        await sendGenericExpoNotification();
      }

      console.log("Sending generic push notification in 10 minutes");
      schedule(genericIntervalMs, true);
    } catch {
      console.error("Notification scheduler run failed");
      schedule(intervalMs, false);
    } finally {
      isDispatchRunning = false;
    }
  };

  schedule(intervalMs, false);

  return () => clearTimeout(timer);
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

  socket.on("message", (message, isBinary) => {
    if (isBinary) {
      sendSocketError(
        socket,
        "unsupported_payload",
        "Binary messages are not supported"
      );
      return;
    }

    const request = parseSocketRequest(message.toString());
    if (!request) {
      sendSocketError(
        socket,
        "invalid_message",
        'Expected {"type":"requestNotifications"}'
      );
      return;
    }

    void broadcastSocketNotifications(wss);
    console.info("Message received from notification socket client");
  });

  socket.on("close", () => {
    console.info("Client disconnected from notification socket");
  });
}
