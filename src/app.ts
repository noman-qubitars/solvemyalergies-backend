import cors from "cors";
import express from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
}));

app.use("/api/v1/subscription/webhook", express.raw({ type: "application/json" }));

app.use(express.json({ limit: '50mb' }));

app.use("/uploads", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, ngrok-skip-browser-warning");
  next();
}, express.static(path.join(process.cwd(), "uploads")));

registerRoutes(app);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Not found" });
});

app.use(errorHandler);

export { app };