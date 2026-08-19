import express from "express";
import { startNotificationScheduler } from "./services/notificationScheduler";
import cors from "cors";
import routes from "./routes/routes";

const server = express();
const HTTP_PORT = Number(process.env.PORT ?? 8000);

server.use(express.json({ limit: "16kb" }));
server.use(cors());
server.use("/", routes);

startNotificationScheduler();

server.listen(HTTP_PORT, () => {
  console.log(`Escuchando backend HTTP en 0.0.0.0:${HTTP_PORT}`);
});
