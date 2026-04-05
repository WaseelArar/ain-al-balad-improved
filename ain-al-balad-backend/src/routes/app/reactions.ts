import type { FastifyInstance } from "fastify";
import { generateDateTime } from "../../lib/scripts/dateTime";

export default async (app: FastifyInstance) => {
  app.post<{ Params: { issuesId: string } }>(
    "/issues/:issuesId/react",
    { onRequest: [app.authenticate] },
    async (req, reply) => {
      const { issuesId } = req.params;
      const user = req.user;
      try {
        const existing = await app.db.selectOne(
          "SELECT reactionsId FROM reactions WHERE issuesId = ? AND usersId = ?",
          [issuesId, user.usersId]
        );
        if (existing) {
          await app.db.execute("DELETE FROM reactions WHERE issuesId = ? AND usersId = ?", [issuesId, user.usersId]);
          return { confirmed: false, message: "تم إلغاء التأكيد" };
        } else {
          await app.db.execute(
            "INSERT INTO reactions (issuesId, usersId, type, createdAt) VALUES (?, ?, 'confirm', ?)",
            [issuesId, user.usersId, generateDateTime()]
          );
          return { confirmed: true, message: "تم تأكيد وجود المشكلة" };
        }
      } catch (err) {
        app.log.error(err);
        return reply.status(500).send({ error: "فشل العملية" });
      }
    }
  );

  app.get<{ Params: { issuesId: string } }>(
    "/issues/:issuesId/reactions",
    { onRequest: [app.authenticate] },
    async (req, reply) => {
      const { issuesId } = req.params;
      const user = req.user;
      try {
        const count = await app.db.selectOne<{ total: number }>(
          "SELECT COUNT(*) as total FROM reactions WHERE issuesId = ?", [issuesId]
        );
        const userReacted = await app.db.selectOne(
          "SELECT reactionsId FROM reactions WHERE issuesId = ? AND usersId = ?",
          [issuesId, user.usersId]
        );
        return { total: count?.total || 0, userConfirmed: !!userReacted };
      } catch (err) {
        return reply.status(500).send({ error: "فشل جلب البيانات" });
      }
    }
  );
};
