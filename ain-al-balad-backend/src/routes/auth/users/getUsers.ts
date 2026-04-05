import type { FastifyInstance } from "fastify";
import CustomError from "../../../lib/classes/customError";

export interface ManagedUser {
  usersId: number;
  username: string;
  phone: string;
  role: "USER" | "ADMIN";
  isActive: number;
  createdAt?: string;
  regionsName?: string; // Updated naming
}

export default async (app: FastifyInstance) => {
  // 1. Get All Users with Region Names
  app.get(
    "/admin/users",
    { onRequest: [app.admin] },
    async (request, reply) => {
      const {
        page = 1,
        limit = 20,
        search = "",
        role = "",
      } = request.query as any;

      const currentUser = request.user;
      const parsedLimit = parseInt(limit);
      const offset = (parseInt(page) - 1) * parsedLimit;

      try {
        let conditions = ["1=1"];
        let params: any[] = [];

        if (role) {
          conditions.push("u.role = ?");
          params.push(role);
        }

        // Auto-filter by admin's own region if they are restricted to one
        if (currentUser.regionsId) {
          conditions.push("u.regionsId = ?");
          params.push(currentUser.regionsId);
        }

        if (search) {
          conditions.push(
            "(u.username LIKE ? OR u.phone LIKE ? OR r.name LIKE ?)",
          );
          params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const whereClause = `WHERE ${conditions.join(" AND ")}`;
        const joinClause = `LEFT JOIN regions r ON u.regionsId = r.regionsId`;

        const countResult = await app.db.selectOne<{ total: number }>(
          `SELECT COUNT(*) as total FROM users u ${joinClause} ${whereClause}`,
          params,
        );
        const total = countResult?.total || 0;

        // Fetch Paginated Users with regionsName alias
        const dataQuery = `
          SELECT u.usersId, u.username, u.phone, u.role, u.isActive, u.createdAt, u.regionsId,
                 r.name as regionsName
          FROM users u
          ${joinClause}
          ${whereClause}
          ORDER BY u.createdAt DESC
          LIMIT ? OFFSET ?`;

        const users = await app.db.select(dataQuery, [
          ...params,
          parsedLimit,
          offset,
        ]);

        return {
          items: users,
          meta: {
            total,
            page: parseInt(page),
            limit: parsedLimit,
            totalPages: Math.ceil(total / parsedLimit),
          },
        };
      } catch (err) {
        app.log.error(err);
        return reply.status(500).send({ message: "فشل جلب قائمة المستخدمين" });
      }
    },
  );

  // 2. Get Single User Detail
  app.get(
    "/admin/users/:id",
    { onRequest: [app.admin] },
    async (req, reply) => {
      const { id } = req.params as { id: string };

      const user = await app.db.selectOne<ManagedUser>(
        `SELECT u.usersId, u.username, u.phone, u.role, u.isActive, u.createdAt,
                r.name as regionsName
         FROM users u
         LEFT JOIN regions r ON u.regionsId = r.regionsId
         WHERE u.usersId = ?`,
        [id],
      );

      if (!user) throw new CustomError("المستخدم غير موجود", 404);

      const stats = await app.db.selectOne(
        "SELECT COUNT(*) as totalIssues, SUM(CASE WHEN solved = 1 THEN 1 ELSE 0 END) as solvedIssues FROM issues WHERE usersId = ?",
        [id],
      );

      return { ...user, stats };
    },
  );
};
