import { prisma } from "../config/db";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected database error";
}

class PushTokenServices {
  static async registerToken(token: string) {
    try {
      const pushToken = await prisma.pushToken.upsert({
        where: { token },
        update: {},
        create: { token },
      });

      return { status: 200, error: false, data: pushToken };
    } catch (error: unknown) {
      return { status: 500, error: true, data: getErrorMessage(error) };
    }
  }

  static async getAllTokens() {
    try {
      const pushTokens = await prisma.pushToken.findMany({
        orderBy: { id: "asc" },
      });

      return { status: 200, error: false, data: pushTokens };
    } catch (error: unknown) {
      return { status: 500, error: true, data: getErrorMessage(error) };
    }
  }

  static async deleteTokensById(ids: number[]) {
    if (ids.length === 0) {
      return { status: 200, error: false, data: [] };
    }

    try {
      const deleted = await prisma.pushToken.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });

      return { status: 200, error: false, data: deleted };
    } catch (error: unknown) {
      return { status: 500, error: true, data: getErrorMessage(error) };
    }
  }
}

export default PushTokenServices;
