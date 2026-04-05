import type { FastifyInstance } from "fastify";
import { generateDateTime } from "../../../../lib/scripts/dateTime";
import { createNotification } from "../../notifications";

interface NewCommentBody {
  content: string;
}

export default async (app: FastifyInstance) => {
  app.post<{ Body: NewCommentBody; Params: { issuesId: string } }>(
    "/issues/:issuesId/comments",
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const { issuesId } = request.params;
      const { content } = request.body;

      if (!content || content.trim().length === 0) {
        return reply.code(400).send({ success: false, message: "التعليق لا يمكن أن يكون فارغاً" });
      }
      if (content.length > 500) {
        return reply.code(400).send({ success: false, message: "التعليق طويل جداً (الحد الأقصى 500 حرف)" });
      }

      const user = (request as any).user;
      if (!user) return reply.code(401).send({ message: "غير مصرح" });

      try {
        const issue = await app.db.selectOne<{ issuesId: number; usersId: number; solved: number }>(
          "SELECT issuesId, usersId, solved FROM issues WHERE issuesId = ?", [issuesId]
        );

        if (!issue) return reply.code(404).send({ success: false, message: "البلاغ غير موجود" });

        if (issue.solved && user.role === "USER") {
          return reply.code(403).send({ success: false, message: "لا يمكن التعليق على بلاغ مغلق" });
        }

        const dateTime = generateDateTime();
        const result = await app.db.execute(
          `INSERT INTO comments (issuesId, usersId, content, date) VALUES (?, ?, ?, ?)`,
          [issuesId, user.usersId, content.trim(), dateTime]
        );

        // إشعار لصاحب البلاغ
        if (issue.usersId !== user.usersId) {
          await createNotification(app.db, issue.usersId,
            `${user.username} علّق على بلاغك`, "comment", Number(issuesId)
          );
        }

        return reply.code(201).send({ success: true, message: "تم إضافة التعليق بنجاح", commentId: result.lastInsertId });
      } catch (err) {
        app.log.error(err);
        return reply.code(500).send({ success: false, message: "حدث خطأ في الخادم" });
      }
    }
  );
};
