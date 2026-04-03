import { Request, Response } from "express";
import NewsService from "../services/newsServices";

class NewsControllers {
  static async getNews(req: Request, res: Response) {
    const { status, error, data } = await NewsService.getAllNews();

    if (error) {
      if (status === 404) {
        return res.status(404).json({ data });
      }
      return res.status(500).json({ data });
    }
    res.status(200).json({ data });
  }
}

export default NewsControllers;
