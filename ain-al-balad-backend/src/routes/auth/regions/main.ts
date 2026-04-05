import type { FastifyInstance } from "fastify";
import CustomError from "../../../lib/classes/customError";

export async function regionAdminRoutes(app: FastifyInstance) {
  // 1. Get all regions (Admin View)
  app.get(
    "/regions",
    {
      onRequest: [app.getuser],
    },
    async (request, reply) => {
      try {
        const user = request.user as { regionsId?: number } | undefined;

        let query: string;
        let params: any[] = [];

        if (user?.regionsId) {
          // Use ? placeholder to prevent SQL Injection
          query =
            "SELECT regionsId, name, description FROM regions WHERE regionsId = ? ORDER BY name ASC";
          params = [user.regionsId];
        } else {
          query = "SELECT regionsId, name, description FROM regions ORDER BY name ASC";
        }

        // Pass params array to your select method
        const result = await app.db.select(query, params);

        if (!result || result.length === 0) {
          throw new CustomError("لم يتم العثور على مناطق في النظام", 404);
        }

        return result;
      } catch (err) {
        if (err instanceof CustomError) throw err;

        app.log.error(err);
        throw new CustomError("فشل في تحميل قائمة المناطق", 500);
      }
    },
  );

  // 2. Create Region
  app.post(
    "/admin/regions",
    {
      onRequest: [app.admin],
    },
    async (request, reply) => {
      const { name, description } = request.body as {
        name: string;
        description?: string;
      };

      if (!name) throw new CustomError("اسم المنطقة مطلوب", 400);

      await app.db.execute(
        "INSERT INTO regions (name, description) VALUES (?, ?)",
        [name, description || ""],
      );

      return { message: "تمت إضافة المنطقة بنجاح" };
    },
  );

  // 3. Update Region
  app.put(
    "/admin/regions/:id",
    {
      onRequest: [app.admin],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { name, description } = request.body as {
        name: string;
        description?: string;
      };

      await app.db.execute(
        "UPDATE regions SET name = ?, description = ? WHERE regionsId = ?",
        [name, description, id],
      );

      return { message: "تم تحديث المنطقة" };
    },
  );

  // 4. Delete Region
  app.delete(
    "/admin/regions/:id",
    {
      onRequest: [app.admin],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      // Optional: Check if users are linked to this region before deleting
      const linkedUsers = await app.db.select(
        "SELECT usersId FROM users WHERE regionsId = ? LIMIT 1",
        [id],
      );
      if (linkedUsers.length > 0) {
        throw new CustomError(
          "لا يمكن حذف هذه المنطقة لوجود مستخدمين مسجلين بها",
          400,
        );
      }

      await app.db.execute("DELETE FROM regions WHERE regionsId = ?", [id]);
      return { message: "تم حذف المنطقة بنجاح" };
    },
  );
}
