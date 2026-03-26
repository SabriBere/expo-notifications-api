import { Request, Response } from "express";
import NewsService from "../services/newsServices";

class NewsControllers {
    static async getNews(req: Request, res: Response){
        const news = NewsService.getAllNews();

        return res.status(200).json({
        ok: true,
        data: news,
        });
    }
}

export default NewsControllers