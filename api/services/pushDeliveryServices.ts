import { Prisma } from "@prisma/client";
import { prisma } from "../config/db";

class PushDeliveryServices {
  private static readonly STALE_CLAIM_MS = 10 * 60 * 1000;

  static async claim(notificationId: number, pushTokenId: number) {
    try {
      await prisma.pushDelivery.create({
        data: { notificationId, pushTokenId },
      });
      return true;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const reclaimed = await prisma.pushDelivery.updateMany({
          where: {
            notificationId,
            pushTokenId,
            status: "pending",
            createdAt: {
              lte: new Date(Date.now() - this.STALE_CLAIM_MS),
            },
          },
          data: { createdAt: new Date() },
        });

        return reclaimed.count === 1;
      }
      throw error;
    }
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
