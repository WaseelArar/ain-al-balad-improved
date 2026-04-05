import fp from "fastify-plugin";
import { type FastifyInstance } from "fastify";
import { Database } from "../lib/classes/Database";
import { migrateDb } from "../lib/migrate/main";
import configStore from "../lib/server/serverConfig";
import path from "path";

export default fp(
  async (fastify: FastifyInstance) => {
    // Initialize both databases
    const connectDatabasePath =
      configStore.value.currentDatabase ??
      path.join(
        configStore.value.dataFolder ?? "",
        configStore.value.databaseName,
      );

    const mainDb = new Database(connectDatabasePath);
    await migrateDb(mainDb);

    // Decorate Fastify instance with dbs
    fastify.decorate("db", mainDb);

    // 1. Your hook is fine, but it needs an explicit trigger
    fastify.addHook("onClose", async (instance: any) => {
      instance.log.info("Closing database connections...");
      mainDb.close();
    });

    const signals =
      process.platform === "win32"
        ? ["SIGINT", "SIGTERM", "SIGBREAK"]
        : ["SIGINT", "SIGTERM", "SIGHUP"];

    signals.forEach((signal) => {
      process.on(signal, async () => {
        try {
          // 1. Trigger Fastify's onClose hook
          await fastify.close();
          process.exit(0);
        } catch (err) {
          console.error("Error during graceful shutdown:", err);
          process.exit(1);
        }
      });
    });
  },
  { name: "sqlitePlugin" },
);

// Extend Fastify type definitions
declare module "fastify" {
  interface FastifyInstance {
    db: Database;
  }
}
