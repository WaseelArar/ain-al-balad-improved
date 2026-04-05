import { type FastifyInstance } from "fastify";
import CustomError from "../../lib/classes/customError";
import { hash } from "../../lib/scripts/hash";
import { generateDateTime } from "../../lib/scripts/dateTime";

export interface SignUpBody {
  username: string;
  password: string;
  phone: string;
  regionsId: number | undefined;
}

export default async function (app: FastifyInstance) {
  app.post<{ Body: SignUpBody }>(
    "/signup",
    {
      config: {
        rateLimit: {
          max: 3,
          timeWindow: "1 minute",
          errorResponseBuilder: (request, context) => {
            return {
              statusCode: 429,
              error: "Too Many Requests",
              message: `محاولات تسجيل كثيرة، يرجى المحاولة بعد ${context.after}`,
            };
          },
        },
      },
    },
    async (req, reply) => {
      try {
        const { username, password, phone, regionsId } = req.body;

        if (!username || !password || !phone) {
          throw new CustomError("معلومات المستخدم ناقصة", 400);
        }

        const hashedPassword = await hash(password);
        const role = "USER";

        // 1. Insert User into DB
        const InsertedUser = await app.db.execute(
          "INSERT INTO users (username, password, phone, regionsId, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
          [
            username,
            hashedPassword,
            phone,
            regionsId,
            role,
            generateDateTime(),
          ],
        );

        // 2. Fetch Region Name if an ID was provided
        let regionsName;
        if (regionsId) {
          const region: { name: string } | undefined = await app.db.selectOne(
            "SELECT name FROM regions WHERE regionsId = ?;",
            [regionsId],
          );
          regionsName = region?.name;
        }

        const userId = InsertedUser.lastInsertId;

        // ✅ 3. Issue JWT including the region name
        // This ensures the profile page doesn't lose the name on refresh
        const token = app.jwt.sign({
          usersId: userId,
          username,
          role,
          regionsId,
          regionsName, // Added to JWT payload
        });

        // 4. Return complete user object to Svelte store
        reply.code(200).send({
          success: true,
          user: {
            usersId: userId,
            username,
            phone,
            role,
            regionsId,
            regionsName, // Used by your Profile component
            token: token,
          },
        });
      } catch (err: any) {
        app.log.error(err);
        // Handle SQLite Unique Constraint (e.g., username already exists)
        if (err.message?.includes("UNIQUE constraint failed")) {
          throw new CustomError("اسم المستخدم أو رقم الهاتف مسجل مسبقاً", 400);
        }
        throw err;
      }
    },
  );
}
