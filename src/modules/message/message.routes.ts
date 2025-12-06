import { Router } from "express";
import {
  sendMessage,
  getAllMessages,
  getUserMessages,
  markAsRead,
  deleteMessageById,
  deleteAllMessages,
} from "./message.controller";
import { authenticate, requireRole } from "../../middleware/auth";
import { upload } from "../../lib/upload";

const messageRouter = Router();

messageRouter.post("/send", authenticate, upload.single("file"), sendMessage);
messageRouter.get("/", authenticate, getAllMessages);
messageRouter.get("/user/:userId", requireRole("admin"), getUserMessages);
messageRouter.put("/mark-read", requireRole("admin"), markAsRead);
messageRouter.delete("/:messageId", authenticate, deleteMessageById);
messageRouter.delete("/chat/all", authenticate, deleteAllMessages);

export { messageRouter };