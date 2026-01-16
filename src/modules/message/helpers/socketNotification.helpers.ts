import { getSocketInstance } from "../../../lib/socketInstance";

/**
 * Emits new message notification via socket
 */
export const emitNewMessage = (messageData: any, targetUserId: string, senderUserId: string, isAdmin: boolean) => {
  const io = getSocketInstance();
  if (io && messageData) {
    io.to(`user:${targetUserId}`).emit("new_message", messageData);
    io.to("admins").emit("new_message", messageData);
    if (!isAdmin) {
      io.to(`user:${senderUserId}`).emit("new_message", messageData);
    }
  }
};

/**
 * Emits chat deleted notification via socket
 */
export const emitChatDeleted = (targetUserId: string) => {
  const io = getSocketInstance();
  if (io) {
    io.to(`user:${targetUserId}`).emit("chat_deleted", { userId: targetUserId });
    io.to("admins").emit("chat_deleted", { userId: targetUserId });
  }
};