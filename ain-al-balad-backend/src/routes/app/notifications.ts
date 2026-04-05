import type { FastifyInstance } from "fastify";
import { generateDateTime } from "../../lib/scripts/dateTime";

export const createNotification = async (
  db: any,
  usersId: number,
  message: string,
  type: string,
  issuesId?: number
) => {
  try {
    await db.execute(
      "INSERT INTO notifications (usersId, issuesId, type, message, isRead, createdAt) VALUES (?, ?, ?, ?, 0, ?)",
      [usersId, issuesId || null, type, message, generateDateTime()]
    );
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
};

export default async (app: FastifyInstance) => {
  app.get("/notifications", { onRequest: [app.authenticate] }, async (req, reply) => {
    const user = req.user;
    try {
      const notifications = await app.db.select(
        `SELECT n.*, i.description as issueDescription
         FROM notifications n
         LEFT JOIN issues i ON n.issuesId = i.issuesId
         WHERE n.usersId = ?
         ORDER BY n.createdAt DESC
         LIMIT 50`,
        [user.usersId]
      );
      const unreadCount = await app.db.selectOne<{ count: number }>(
        "SELECT COUNT(*) as count FROM notifications WHERE usersId = ? AND isRead = 0",
        [user.usersId]
      );
      return { notifications, unreadCount: unreadCount?.count || 0 };
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "فشل جلب الإشعارات" });
    }
  });

  app.patch("/notifications/read-all", { onRequest: [app.authenticate] }, async (req, reply) => {
    const user = req.user;
    try {
      await app.db.execute("UPDATE notifications SET isRead = 1 WHERE usersId = ?", [user.usersId]);
      return { success: true };
    } catch (err) {
      return reply.status(500).send({ error: "فشل تحديث الإشعارات" });
    }
  });
};
