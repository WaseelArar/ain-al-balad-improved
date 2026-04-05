import { type FastifyInstance } from "fastify";
import CustomError from "../../../lib/classes/customError";

export default async function (app: FastifyInstance) {
  app.delete(
    "/admin/users/:usersId",
    {
      onRequest: [app.admin], // Restricted to Admins
    },
    async (req, reply) => {
      const { usersId } = req.params as { usersId: string };
      const loggedInUser = (req as any).user;

      try {
        // 1. Prevent self-deletion
        if (Number(usersId) === loggedInUser.usersId) {
          throw new CustomError("لا يمكنك حذف حسابك الخاص", 400);
        }

        // 2. Check if user exists
        const userExists = await app.db.selectOne(
          "SELECT usersId FROM users WHERE usersId = ?",
          [usersId],
        );

        if (!userExists) {
          throw new CustomError("المستخدم غير موجود", 404);
        }

        // 3. Execute Delete
        // Note: If you have foreign keys (like issues),
        // ensure your DB schema uses "ON DELETE CASCADE"
        // or handle related records here.
        await app.db.execute("DELETE FROM users WHERE usersId = ?", [usersId]);

        return reply.code(200).send({
          success: true,
          message: "تم حذف المستخدم بنجاح",
        });
      } catch (err: any) {
        app.log.error(err);
        if (err instanceof CustomError) throw err;
        throw new CustomError("حدث خطأ أثناء محاولة حذف المستخدم", 500);
      }
    },
  );
}
