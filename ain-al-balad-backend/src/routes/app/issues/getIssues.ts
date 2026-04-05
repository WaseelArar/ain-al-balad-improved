import type { FastifyInstance } from "fastify";

export default async (app: FastifyInstance) => {
  app.get(
    "/issues",
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const user = (request as any).user;
      const regionsId = user?.regionsId;
      const isAdmin = user?.role === "ADMIN" || user?.role === "MUNICIPAL";
      const currentUsersId = user?.usersId;

      const {
        page = 1,
        limit = 30,
        search = "",
        solved,
        privateIssue,
        usersId,
      } = request.query as any;

      const parsedLimit = Math.min(parseInt(limit) || 30, 100);
      const parsedPage = Math.max(parseInt(page) || 1, 1);
      const offset = (parsedPage - 1) * parsedLimit;

      try {
        let conditions = [];
        let params: any[] = [];

        if (isAdmin) {
          if (privateIssue === "true") conditions.push("issues.privateIssue = 1");
        } else {
          conditions.push("(issues.privateIssue = 0 OR issues.usersId = ?)");
          params.push(currentUsersId);
        }

        if (usersId) {
          conditions.push("issues.usersId = ?");
          params.push(parseInt(usersId));
        }

        if (regionsId) {
          conditions.push("users.regionsId = ?");
          params.push(parseInt(regionsId));
        }

        if (solved !== undefined) {
          conditions.push("issues.solved = ?");
          params.push(solved === "true" ? 1 : 0);
        }

        if (search && search.length <= 100) {
          conditions.push("(issues.description LIKE ? OR issues.location LIKE ? OR issues.title LIKE ?)");
          params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
        const joinClause = `LEFT JOIN users ON issues.usersId = users.usersId`;

        const countQuery = `SELECT COUNT(*) as total FROM issues ${joinClause} ${whereClause}`;
        const countResult = await app.db.selectOne<{ total: number }>(countQuery, params);
        const total = countResult?.total || 0;

        const dataQuery = `
          SELECT
            issues.*,
            users.username,
            users.regionsId,
            COALESCE(r.reactionCount, 0) as confirmCount,
            CASE WHEN ur.usersId IS NOT NULL THEN 1 ELSE 0 END as userConfirmed
          FROM issues
          ${joinClause}
          LEFT JOIN (
            SELECT issuesId, COUNT(*) as reactionCount
            FROM reactions GROUP BY issuesId
          ) r ON issues.issuesId = r.issuesId
          LEFT JOIN reactions ur ON issues.issuesId = ur.issuesId AND ur.usersId = ?
          ${whereClause}
          ORDER BY issues.date DESC
          LIMIT ? OFFSET ?`;

        const issues = await app.db.select(dataQuery, [
          currentUsersId,
          ...params,
          parsedLimit,
          offset,
        ]);

        return {
          items: issues,
          meta: {
            total,
            page: parsedPage,
            limit: parsedLimit,
            totalPages: Math.ceil(total / parsedLimit),
          },
        };
      } catch (err) {
        app.log.error(err);
        return reply.status(500).send({ message: "فشل في تحميل البلاغات" });
      }
    }
  );
};
