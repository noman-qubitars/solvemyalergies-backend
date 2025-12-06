import { Server as SocketServer } from "socket.io";

let ioInstance: SocketServer | null = null;

export const setSocketInstance = (io: SocketServer) => {
  ioInstance = io;
};

export const getSocketInstance = (): SocketServer | null => {
  return ioInstance;
};