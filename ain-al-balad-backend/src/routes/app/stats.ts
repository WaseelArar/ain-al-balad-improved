import type { FastifyInstance } from "fastify";

export default async (app: FastifyInstance) => {
  app.get("/admin/stats", { onRequest: [app.authenticate] }, async (req, reply) => {
    const user = req.user;
    const isAdmin = user.role === "ADMIN" || user.role === "MUNICIPAL";
    if (!isAdmin) return reply.code(403).send({ error: "غير مصرح" });

    try {
      const regionFilter = user.regionsId
        ? "LEFT JOIN users u2 ON issues.usersId = u2.usersId WHERE u2.regionsId = ?"
        : "";
      const regionParams = user.regionsId ? [user.regionsId] : [];

      const issueStats = await app.db.selectOne<{
        total: number; solved: number; pending: number; thisMonth: number;
      }>(`SELECT COUNT(*) as total,
            SUM(CASE WHEN solved=1 THEN 1 ELSE 0 END) as solved,
            SUM(CASE WHEN solved=0 THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN date >= date('now','-30 days') THEN 1 ELSE 0 END) as thisMonth
          FROM issues ${regionFilter}`, regionParams);

      const userStats = await app.db.selectOne<{
        total: number; active: number; newThisMonth: number;
      }>(`SELECT COUNT(*) as total,
            SUM(CASE WHEN isActive=1 THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN createdAt >= date('now','-30 days') THEN 1 ELSE 0 END) as newThisMonth
          FROM users WHERE role='USER' ${user.regionsId ? "AND regionsId=?" : ""}`,
        user.regionsId ? [user.regionsId] : []);

      const topRegions = await app.db.select(
        `SELECT r.name, COUNT(i.issuesId) as issueCount
         FROM regions r
         LEFT JOIN users u ON r.regionsId = u.regionsId
         LEFT JOIN issues i ON u.usersId = i.usersId
         GROUP BY r.regionsId ORDER BY issueCount DESC LIMIT 5`
      );

      const last7Days = await app.db.select(
        `SELECT date(date) as day, COUNT(*) as count
         FROM issues WHERE date >= date('now','-7 days')
         GROUP BY date(date) ORDER BY day ASC`
      );

      return { issues: issueStats, users: userStats, topRegions, last7Days };
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "فشل جلب الإحصائيات" });
    }
  });
};
