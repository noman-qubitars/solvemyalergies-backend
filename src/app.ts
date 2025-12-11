import cors from "cors";
import express from "express";
import path from "path";
import { authRouter } from "./modules/auth/auth.routes";
import { subscriptionRouter } from "./modules/subscription/subscription.routes";
import { quizRouter } from "./modules/quiz/quiz.routes";
import { userRouter } from "./modules/user/user.routes";
import { dailySessionRouter } from "./modules/dailySession/dailySession.routes";
import { messageRouter } from "./modules/message/message.routes";
import { educationalVideoRouter } from "./modules/educationalVideo/educationalVideo.routes";
import { profileRouter } from "./modules/profile/profile.routes";

const app = express();

app.use(cors({
  // origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
}));

app.use("/subscription/webhook", express.raw({ type: "application/json" }));

app.use(express.json());

app.use("/uploads", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, ngrok-skip-browser-warning");
  next();
}, express.static(path.join(process.cwd(), "uploads")));
app.use("/auth", authRouter);
app.use("/subscription", subscriptionRouter);
app.use("/api/quiz", quizRouter);
app.use("/api/users", userRouter);
app.use("/api/daily-session", dailySessionRouter);
app.use("/api/messages", messageRouter);
app.use("/api/educational-videos", educationalVideoRouter);
app.use("/api/profile", profileRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

export { app };