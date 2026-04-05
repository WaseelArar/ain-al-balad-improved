import { type FastifyInstance } from "fastify";
import CustomError from "../../../lib/classes/customError";

interface UpdateStatusBody {
  usersId: number;
}

export default async function (app: FastifyInstance) {
  app.patch<{ Body: UpdateStatusBody }>(
    "/admin/users/status",
    {
      onRequest: [app.admin],
    },
    async (req, reply) => {
      const { usersId } = req.body;
      const loggedInUser = (req as any).user;

      try {
        // 1. Safety Check: Don't allow an admin to deactivate themselves
        if (Number(usersId) === loggedInUser.usersId) {
          throw new CustomError("لا يمكنك إلغاء تفعيل حسابك الخاص", 400);
        }

        // 2. Fetch only the current status
        const user = await app.db.selectOne<{ isActive: number }>(
          "SELECT isActive FROM users WHERE usersId = ?",
          [usersId],
        );

        if (!user) throw new CustomError("المستخدم غير موجود", 404);

        // 3. Flip the status (0 becomes 1, 1 becomes 0)
        const newStatus = user.isActive === 1 ? 0 : 1;

        // 4. Update
        await app.db.execute(
          "UPDATE users SET isActive = ? WHERE usersId = ?",
          [newStatus, usersId],
        );

        return reply.code(200).send({
          success: true,
          message:
            newStatus === 1 ? "تم تفعيل الحساب بنجاح" : "تم إلغاء تفعيل الحساب",
          isActive: !!newStatus, // Return as boolean for the frontend
        });
      } catch (err: any) {
        app.log.error(err);
        if (err instanceof CustomError) throw err;
        throw new CustomError("فشل تحديث حالة الحساب", 500);
      }
    },
  );
}
