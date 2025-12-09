import { Server as SocketServer } from "socket.io";
import { AuthenticatedSocket } from "../../lib/socket";
import { createMessage } from "./message.service";
import { User } from "../../models/User";

export const setupMessageSocket = (io: SocketServer) => {
  io.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    const userRole = socket.userRole || "user";

    socket.join(`user:${userId}`);

    if (userRole === "admin") {
      socket.join("admins");
    }

    socket.on("send_message", async (data: {
      messageType: "text" | "voice" | "image" | "document" | "pdf";
      content?: string;
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
      userId?: string;
    }) => {
      try {
        const isAdmin = userRole === "admin";
        const targetUserId = isAdmin ? (data.userId || userId) : userId;

        const messageData = {
          userId: targetUserId,
          adminId: isAdmin ? userId : undefined,
          messageType: data.messageType,
          content: data.content,
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          mimeType: data.mimeType,
          sentBy: isAdmin ? "admin" as const : "user" as const,
        };

        const result = await createMessage(messageData);
        const message = result.data;

        io.to(`user:${targetUserId}`).emit("new_message", message);
        io.to("admins").emit("new_message", message);
        socket.emit("new_message", message);
        socket.emit("message_sent", { success: true, data: message });
      } catch (error: any) {
        socket.emit("message_error", { 
          success: false, 
          message: error.message || "Failed to send message" 
        });
      }
    });

    socket.on("join_user_room", (targetUserId: string) => {
      if (userRole === "admin") {
        socket.join(`user:${targetUserId}`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected`);
    });
  });
};