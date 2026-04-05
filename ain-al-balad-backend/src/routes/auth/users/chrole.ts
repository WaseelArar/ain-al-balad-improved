import { type FastifyInstance } from "fastify";
import CustomError from "../../../lib/classes/customError";
import { generateDateTime } from "../../../lib/scripts/dateTime";

interface UpdateRoleBody {
  usersId: number;
  newRole: "USER" | "ADMIN";
}

export default async function (app: FastifyInstance) {
  app.patch<{ Body: UpdateRoleBody }>(
    "/admin/users/chrole",
    {
      // Assuming app.admin handles both app.authenticate and the role check
      onRequest: [app.admin],
    },
    async (req, reply) => {
      const { usersId, newRole } = req.body;

      try {
        // 1. Fetch the user record to get the username (required for updateUser)
        const targetUser = await app.db.selectOne<{
          usersId: number;
          username: string;
        }>("SELECT usersId,username FROM users WHERE usersId = ?", [usersId]);

        if (!targetUser) {
          throw new CustomError("المستخدم غير موجود", 404);
        }
        const dateTime = generateDateTime();
        await app.db.execute(
          "UPDATE users SET role = ? ,updatedAt = ? WHERE usersId = ?",
          [newRole, dateTime, targetUser.usersId],
        );

        return reply.code(200).send({
          success: true,
          message: `تم تغيير رتبة المستخدم ${targetUser.username} إلى ${newRole} بنجاح`,
        });
      } catch (err: any) {
        app.log.error(err);

        // Preserve your specific Arabic error messages from the DB helper
        if (err instanceof CustomError) throw err;
        throw new CustomError(err.message || "فشل تحديث الرتبة", 500);
      }
    },
  );
}
