import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import * as fsService from "../../lib/server/serverDataManagement"; // The file we just finished
import configStore, { type ServerConfig } from "../../lib/server/serverConfig";

export default async function settingsRoutes(app: FastifyInstance) {
  // We exclude sensitive data like the raw license key if needed
  app.get("/config", { onRequest: [app.authenticate] }, async () => {
    return configStore.value;
  });

  /**
   * 📁 Update Data Folder
   * Moves the database file and reboots the server.
   */
  app.post(
    "/config/data-folder",
    { onRequest: [app.admin] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { folder } = req.body as { folder: string };
      try {
        await fsService.updateDataFolder(app.db, folder);
        return { message: "تم نقل البيانات بنجاح، جارِ إعادة التشغيل..." };
      } catch (err: any) {
        app.log.error(err);
        return reply.status(500).send({ error: err.message });
      }
    },
  );

  /**
   * 🏷️ Rename Database
   * Renames the .sqlite file and reboots.
   */
  app.patch(
    "/config/database-name",
    { onRequest: [app.admin] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { name } = req.body as { name: string };
      try {
        await fsService.updateDatabaseName(app.db, name);
        return { message: "تم تغيير اسم القاعدة، جارِ إعادة التشغيل..." };
      } catch (err: any) {
        app.log.error(err);
        return reply.status(500).send({ error: err.message });
      }
    },
  );

  /**
   * 💾 Create Backup
   * Closes DB, copies file, reopens DB, cleans old backups.
   */
  app.post(
    "/config/backup",
    { onRequest: [app.admin] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        await fsService.createDbBackup(app.db);
        return { message: "تم إنشاء النسخة الاحتياطية بنجاح" };
      } catch (err: any) {
        app.log.error(err);
        return reply.status(500).send({ error: err.message });
      }
    },
  );

  /**
   * 📂 Set Backup Folder
   * Validates permissions and updates config.
   */
  app.post(
    "/config/backup-folder",
    { onRequest: [app.admin] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { folder } = req.body as { folder: string };
      try {
        await fsService.updateBackUpFolder(folder);
        return { message: "تم تحديث مسار النسخ الاحتياطي" };
      } catch (err: any) {
        app.log.error(err);
        return reply.status(400).send({ error: err.message });
      }
    },
  );

  /**
   * 🧪 Load Temporary Database
   * Points the server to a different file (e.g., for testing or viewing old data).
   */

  app.post(
    "/config/create-db",
    { onRequest: [app.admin] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { name } = req.body as { name: string };
      try {
        await fsService.createDatabaseWithName(name);
        return { message: "تم تحميل القاعدة المؤقتة، جارِ إعادة التشغيل..." };
      } catch (err: any) {
        app.log.error(err);
        return reply.status(400).send({ error: err.message });
      }
    },
  );

  app.post(
    "/config/temp-db",
    { onRequest: [app.admin] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { path } = req.body as { path: string | undefined };
      try {
        await fsService.loadTemporaryDb(path);
        return { message: "تم تحميل القاعدة المؤقتة، جارِ إعادة التشغيل..." };
      } catch (err: any) {
        app.log.error(err);
        return reply.status(400).send({ error: err.message });
      }
    },
  );

  /**
   * 📍 Set Persistent Database
   * Takes the current temporary DB and makes it the permanent one.
   */
  app.post(
    "/config/make-persistent",
    { onRequest: [app.admin] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        await fsService.setPersistentDatabase();
        return { message: "تم تثبيت قاعدة البيانات الحالية" };
      } catch (err: any) {
        app.log.error(err);
        return reply.status(500).send({ error: err.message });
      }
    },
  );

  /**
   * 📦 Copy Database
   * Creates a one-off copy of the DB to a specific directory.
   */
  app.post(
    "/config/copy-to",
    { onRequest: [app.admin] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { destination } = req.body as { destination: string };
      try {
        await fsService.copyDatabaseFile(app.db, destination);
        return { message: "تم نسخ الملف بنجاح" };
      } catch (err: any) {
        app.log.error(err);
        return reply.status(500).send({ error: err.message });
      }
    },
  );
}
