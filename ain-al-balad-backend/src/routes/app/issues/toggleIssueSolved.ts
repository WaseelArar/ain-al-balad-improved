import { type FastifyInstance } from "fastify";
import CustomError from "../../../lib/classes/customError";
import { createNotification } from "../notifications";

interface UpdateIssueStatusBody {
  solved: boolean;
}
interface UpdateIssueParams {
  issuesId: string;
}

export default async function (app: FastifyInstance) {
  app.patch<{ Body: UpdateIssueStatusBody; Params: UpdateIssueParams }>(
    "/issues/:issuesId",
    { onRequest: [app.authenticate] },
    async (req, reply) => {
      const role = (req as any).user.role;
      if (role !== "ADMIN" && role !== "MUNICIPAL") throw new CustomError("غير مصرح", 403);

      const { issuesId } = req.params;
      const { solved } = req.body;

      try {
        const existingIssue = await app.db.selectOne<{ issuesId: number; usersId: number; description: string }>(
          "SELECT issuesId, usersId, description FROM issues WHERE issuesId = ?", [issuesId]
        );
        if (!existingIssue) throw new CustomError("البلاغ غير موجود", 404);

        await app.db.execute(
          "UPDATE issues SET solved = ?, updatedAt = datetime('now') WHERE issuesId = ?",
          [solved ? 1 : 0, issuesId]
        );

        // إشعار لصاحب البلاغ
        const msg = solved
          ? `تم حل بلاغك: "${existingIssue.description.substring(0, 40)}..."`
          : `تم إعادة فتح بلاغك: "${existingIssue.description.substring(0, 40)}..."`;
        await createNotification(app.db, existingIssue.usersId, msg, "status_change", Number(issuesId));

        return reply.code(200).send({
          success: true,
          message: solved ? "تم إغلاق البلاغ بنجاح" : "تم إعادة فتح البلاغ",
          data: { issuesId, solved },
        });
      } catch (err: any) {
        app.log.error(err);
        if (err instanceof CustomError) throw err;
        throw new CustomError(err.message || "فشل تحديث حالة البلاغ", 500);
      }
    }
  );
}
