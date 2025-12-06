import { config } from "./config/env";
import { app } from "./app";
import { connectDB } from "./lib/mongoose";
import { initializeSocket } from "./lib/socket";
import { setupMessageSocket } from "./modules/message/message.socket";
import { setSocketInstance } from "./lib/socketInstance";

const port = config.port;

connectDB().then(() => {
  const httpServer = app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });

  const io = initializeSocket(httpServer);
  setSocketInstance(io);
  setupMessageSocket(io);

  const handleShutdown = async () => {
    httpServer.close(async () => {
      const { disconnectDB } = await import("./lib/mongoose");
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on("SIGINT", handleShutdown);
  process.on("SIGTERM", handleShutdown);
});