import Fastify from "fastify";
import userPlugins from "./plugins/main";
import appRoutes from "./routes/main";
import configStore, { stopExisting } from "./lib/server/serverConfig";
import { type FastifyInstance } from "fastify";
// ... existing imports ...

let fastify: FastifyInstance | null;
let isRebooting = false; // [1] Add a lock flag

const start = async (app: FastifyInstance, retryCount = 0) => {
  const host = "0.0.0.0";
  const { port } = configStore.value;
  try {
    // Fastify/Bun can be picky about re-binding; ensure host is 0.0.0.0
    await app.listen({ port, host });
    app.log.info(`🚀 Server running at http://${host}:${port}`);
  } catch (err: any) {
    if (err.code === "EADDRINUSE" && retryCount < 5) {
      app.log.warn(`Port ${port} locked. Retry ${retryCount + 1}/5 in 1s...`);
      // Wait 1 second and try again
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return start(app, retryCount + 1);
    } else {
      app.log.error(err);
      // If we can't bind after retries, we must exit or the app is a zombie
      process.exit(1);
    }
  }
};

export const startServer = async () => {
  console.dir(configStore.value);

  if (isRebooting) return; // [2] Prevent overlapping restarts
  isRebooting = true;
  try {
    if (fastify) {
      // 1. Force close is required to drop sockets immediately
      await fastify.close();
      fastify = null;
      console.log("🛑 Old Fastify instance closed.");
    }

    // 2. Initialize Instance with socket termination enabled
    const currentApp = Fastify({
      logger: { level: configStore.value.verbose ? "debug" : "info" },
      /*https: {
        key: fs.readFileSync(path.resolve(`src/lib/cert/key.pem`)),
        cert: fs.readFileSync(path.resolve(`src/lib/cert/cert.pem`)),
        },*/
      // 🚀 This is the fix: Kills active sockets so the port releases instantly
      forceCloseConnections: true,
    });

    fastify = currentApp;

    await userPlugins(currentApp);
    await appRoutes(currentApp);

    // ... routes ...
    currentApp.get("/status", async () => ({
      online: true,
      //config: configStore.value,
    }));

    currentApp.get(
      "/close",
      { onRequest: [currentApp.admin] },
      async (req, res) => {
        // Calling close() now automatically handles DBs via the hook!
        await currentApp.close();
        return stopExisting();
      },
    );

    await start(currentApp);
  } finally {
    isRebooting = false; // [3] Release the lock
  }
};

// 3. Initial Boot
startServer();

// 4. REBOOT HANDLER
let rebootTimer: Timer | null = null;

configStore.subscribe(() => {
  console.log("🔄 Config change detected. Scheduling reboot...");

  // DEBOUNCE: If multiple changes happen (e.g. key + eolNum),
  // only reboot once after things settle.
  if (rebootTimer) clearTimeout(rebootTimer);

  rebootTimer = setTimeout(async () => {
    try {
      await startServer();
    } catch (err) {
      console.error("❌ Reboot failed:", err);
    }
  }, 300); // 300ms gives Bun/OS enough breathing room
});
