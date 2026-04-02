import { prisma } from "../config/db";

class NewsServices {
  static async getAllNews() {
    try {
      const newsList = await prisma.alert.findMany({
        orderBy: {
          id: "asc",
        },
      });

      if (newsList.length === 0) {
        return {
          status: 404,
          error: true,
          data: [],
        };
      }

      return { status: 200, error: false, data: newsList };
    } catch (error: any) {
      return { status: 500, error: true, data: error.message };
    }
  }
}

export default NewsServices;
