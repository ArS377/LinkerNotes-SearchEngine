import { access } from "node:fs/promises";

try {
  await access(".env");
  process.loadEnvFile(".env");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const { startServer } = await import("./server.js");
const server = startServer();

function shutdown() {
  server.close(() => process.exit(0));
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
