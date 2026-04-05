import { type FastifyInstance } from "fastify";
import CustomError from "../../lib/classes/customError";
import { verify } from "../../lib/scripts/hash";
import type { User } from "../../lib/Database/user";

export interface LoginBody {
  username: string;
  password: string;
}

export default async function (app: FastifyInstance) {
  app.post<{ Body: LoginBody }>(
    "/login",
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "1 minute",
          errorResponseBuilder: (request, context) => ({
            statusCode: 429,
            error: "Too Many Requests",
            message: `تمت محاولة تسجيل الدخول عدة مرات، يرجى المحاولة بعد ${context.after}`,
          }),
        },
      },
    },
    async (req, reply) => {
      try {
        const { username, password } = req.body;

        if (!username || !password) {
          throw new CustomError("يرجى إدخال اسم المستخدم وكلمة المرور", 400);
        }

        // Use a LEFT JOIN to get user and region name in one single query
        const user: (User & { regionsName?: string }) | undefined =
          await app.db.selectOne(
            `SELECT u.*, r.name as regionsName
           FROM users u
           LEFT JOIN regions r ON u.regionsId = r.regionsId
           WHERE u.username = ?`,
            [username],
          );

        if (!user) throw new CustomError("بيانات الاعتماد غير صحيحة", 401);

        if (!user.isActive) {
          throw new CustomError(
            "هذا الحساب معطل، يرجى التواصل مع المسؤول",
            403,
          );
        }

        const passwordMatch = await verify(password, user.password);
        if (!passwordMatch)
          throw new CustomError("بيانات الاعتماد غير صحيحة", 401);

        // ✅ Issue JWT with region info included
        const token = app.jwt.sign({
          usersId: user.usersId,
          username: user.username,
          role: user.role,
          regionsId: user.regionsId,
          regionsName: user.regionsName, // Added to JWT for persistence
        });

        return reply.code(200).send({
          success: true,
          user: {
            usersId: user.usersId,
            username: user.username,
            role: user.role,
            token: token,
            regionsId: user.regionsId,
            regionsName: user.regionsName, // Matches your Svelte profile logic
            phone: user.phone, // Include if needed for the profile store
          },
        });
      } catch (err: any) {
        app.log.error(err);
        if (err instanceof CustomError) throw err;
        throw new CustomError("حدث خطأ أثناء تسجيل الدخول", 500);
      }
    },
  );
}
