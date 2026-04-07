import { prisma } from "../config/db";

class PushTokenServices {
  static async registerToken(token: string) {
    try {
      const pushToken = await prisma.pushToken.upsert({
        where: { token },
        update: {},
        create: { token },
      });

      return { status: 200, error: false, data: pushToken };
    } catch (error: any) {
      return { status: 500, error: true, data: error.message };
    }
  }

  static async getAllTokens() {
    try {
      const pushTokens = await prisma.pushToken.findMany({
        orderBy: { id: "asc" },
      });

      return { status: 200, error: false, data: pushTokens };
    } catch (error: any) {
      return { status: 500, error: true, data: error.message };
    }
  }

  static async deleteTokens(tokens: string[]) {
    if (tokens.length === 0) {
      return { status: 200, error: false, data: [] };
    }

    try {
      const deleted = await prisma.pushToken.deleteMany({
        where: {
          token: {
            in: tokens,
          },
        },
      });

      return { status: 200, error: false, data: deleted };
    } catch (error: any) {
      return { status: 500, error: true, data: error.message };
    }
  }
}

export default PushTokenServices;
