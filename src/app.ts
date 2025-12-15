import cors from "cors";
import express from "express";
import path from "path";
import { registerRoutes } from "./routes";

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
}));

app.use("/api/v1/subscription/webhook", express.raw({ type: "application/json" }));

app.use(express.json());

app.use("/uploads", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, ngrok-skip-browser-warning");
  next();
}, express.static(path.join(process.cwd(), "uploads")));

registerRoutes(app);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

export { app };