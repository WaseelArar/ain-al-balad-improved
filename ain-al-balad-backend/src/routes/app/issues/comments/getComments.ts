import type { FastifyInstance } from "fastify";

export default async (app: FastifyInstance) => {
  app.get(
    "/issues/:issuesId/comments",
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const { issuesId } = request.params as { issuesId: string };

      try {
        // 1. Fetch comments and join with users to get the author's name
        const query = `
          SELECT
            comments.*,
            users.username
          FROM comments
          LEFT JOIN users ON comments.usersId = users.usersId
          WHERE comments.issuesId = ?
          ORDER BY comments.commentsId DESC`; // ASC to read like a conversation

        const comments = await app.db.select(query, [issuesId]);

        return {
          success: true,
          data: comments,
        };
      } catch (err) {
        app.log.error(err);
        return reply.code(500).send({
          success: false,
          message: "Failed to fetch comments",
        });
      }
    },
  );
};
