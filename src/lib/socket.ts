import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import { User } from "../models/User";

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export const initializeSocket = (httpServer: HttpServer) => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const decoded = jwt.verify(token, config.jwtSecret) as { sub: string; role?: string };
      const user = await User.findById(decoded.sub);

      if (!user) {
        return next(new Error("User not found"));
      }

      if (user.status === "Blocked") {
        return next(new Error("Your account has been blocked"));
      }

      socket.userId = decoded.sub;
      socket.userRole = decoded.role || user.role || "user";
      next();
    } catch (error: any) {
      next(new Error("Invalid or expired token"));
    }
  });

  return io;
};