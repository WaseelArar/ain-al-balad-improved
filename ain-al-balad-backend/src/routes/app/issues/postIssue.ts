import type { FastifyInstance } from "fastify";
import { generateDateTime } from "../../../lib/scripts/dateTime";
import { createNotification } from "../notifications";
import CustomError from "../../../lib/classes/customError";

interface NewIssueBody {
  title?: string;
  location?: { longitude: number; latitude: number };
  altLocation: string;
  description: string;
  image: string;
  privateIssue: boolean;
}

export default async (app: FastifyInstance) => {
  app.post<{ Body: NewIssueBody }>(
    "/issues",
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const { title = "", location, altLocation, description, image, privateIssue = true } = request.body;

      if (!description || description.trim().length < 10) {
        throw new CustomError("وصف البلاغ يجب أن يكون 10 أحرف على الأقل", 400);
      }
      if (description.length > 1000) {
        throw new CustomError("وصف البلاغ طويل جداً (الحد الأقصى 1000 حرف)", 400);
      }

      const usersId = (request as any).user?.usersId;
      let locationData: string = altLocation || "";
      if (location && location.latitude && location.longitude) {
        locationData = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
      }

      try {
        const dateTime = generateDateTime();
        const result = await app.db.execute(
          `INSERT INTO issues (usersId, title, image, location, description, date, solved, privateIssue)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [usersId, title.trim(), image || null, locationData, description.trim(), dateTime, 0, privateIssue ? 1 : 0]
        );

        // إشعار للمشرفين عند بلاغ جديد غير خاص
        if (!privateIssue) {
          const admins = await app.db.select<{ usersId: number }>(
            "SELECT usersId FROM users WHERE role IN ('ADMIN', 'MUNICIPAL') AND isActive = 1"
          );
          for (const admin of admins) {
            if (admin.usersId !== usersId) {
              await createNotification(app.db, admin.usersId,
                `بلاغ جديد: ${description.substring(0, 50)}...`,
                "new_issue", result.lastInsertId
              );
            }
          }
        }

        return reply.code(201).send({
          success: true,
          message: "تم إنشاء البلاغ بنجاح",
          issueId: result.lastInsertId,
        });
      } catch (err: any) {
        app.log.error(err);
        if (err instanceof CustomError) throw err;
        throw new CustomError("حدث خطأ أثناء إنشاء البلاغ", 500);
      }
    }
  );
};
