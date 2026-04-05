import { type FastifyInstance } from "fastify";
import CustomError from "../../lib/classes/customError";
import { hash } from "../../lib/scripts/hash"; // Import your hashing utility
import { generateDateTime } from "../../lib/scripts/dateTime";

interface UpdatePasswordBody {
  newPassword: string;
}

export default async function (app: FastifyInstance) {
  app.patch<{ Body: UpdatePasswordBody }>(
    "/auth/chpasswd",
    {
      onRequest: [app.authenticate],
    },
    async (req, reply) => {
      try {
        const { newPassword } = req.body;
        const loggedInUser = (req as any).user;

        // 1. Validation
        if (!newPassword || newPassword.length < 8) {
          throw new CustomError(
            "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
            400,
          );
        }

        const dateTime = generateDateTime();
        // 2. Hash the new password before saving!
        const hashedPassword = await hash(newPassword);

        // 3. Direct, Scoped Update
        // We use usersId from the JWT to ensure the user can ONLY update themselves.
        await app.db.execute(
          "UPDATE users SET password = ? ,updatedAt = ? WHERE usersId = ?",
          [hashedPassword, dateTime, loggedInUser.usersId],
        );

        return reply.code(200).send({
          success: true,
          message: "تم تحديث كلمة المرور بنجاح",
        });
      } catch (err: any) {
        app.log.error(err);
        if (err instanceof CustomError) throw err;
        throw new CustomError("فشل تحديث كلمة المرور", 500);
      }
    },
  );
}
