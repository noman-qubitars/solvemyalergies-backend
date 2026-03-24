import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import path from "path";
import { registerRoutes } from "./routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(helmet());

app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev", {
    skip: () => process.env.NODE_ENV === "test",
  })
);

const parseCorsOrigins = (raw: string | undefined): string[] => {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

const allowedOrigins = parseCorsOrigins(process.env.CORS_ORIGINS);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
}));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);
app.use("/api/v1/auth", authLimiter);

// Stripe webhook must receive the raw body to validate signatures.
app.use("/api/v1/subscription/webhook", express.raw({ type: "application/json" }));

// JSON parser for all routes except the Stripe webhook endpoint.
app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/api/v1/subscription/webhook")) {
    return next();
  }
  return express.json({ limit: "10mb" })(req, res, next);
});

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