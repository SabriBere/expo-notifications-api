import { prisma } from "../config/db";

class PushDeliveryServices {
  private static readonly STALE_CLAIM_MS = 10 * 60 * 1000;

  static async claim(notificationId: number, pushTokenId: number) {
    const now = new Date();
    const reclaimed = await prisma.pushDelivery.updateMany({
      where: {
        notificationId,
        pushTokenId,
        status: "pending",
        createdAt: {
          lte: new Date(now.getTime() - this.STALE_CLAIM_MS),
        },
      },
      data: { createdAt: now },
    });

    if (reclaimed.count === 1) {
      return true;
    }

    const inserted = await prisma.$executeRaw`
      INSERT OR IGNORE INTO "PushDelivery"
        ("notificationId", "pushTokenId", "status", "createdAt")
      VALUES
        (${notificationId}, ${pushTokenId}, 'pending', ${now})
    `;

    return inserted === 1;
  }

  static async markDelivered(notificationId: number, pushTokenId: number) {
    await prisma.pushDelivery.update({
      where: {
        notificationId_pushTokenId: { notificationId, pushTokenId },
      },
      data: { status: "sent", deliveredAt: new Date() },
    });
  }

  static async release(notificationId: number, pushTokenId: number) {
    await prisma.pushDelivery.deleteMany({
      where: { notificationId, pushTokenId, status: "pending" },
    });
  }
}

export default PushDeliveryServices;
