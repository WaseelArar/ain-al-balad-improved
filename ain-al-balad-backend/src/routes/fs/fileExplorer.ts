// server.ts
import { type FastifyInstance } from "fastify";
import { readdir } from "fs/promises";
import { join, resolve } from "path";

export default async function (app: FastifyInstance) {
  app.post(
    "/file-explorer",
    {
      onRequest: [app.admin], // Ensure your admin hook is correctly registered
    },
    async (req, reply) => {
      try {
        // 1. Get path from query string (e.g., /file-explorer?path=/var/www)
        // In Fastify, use req.query instead of req.searchParams
        const query = req.query as { path?: string; type?: "all" | "dirs" };
        let parentDir = query.path || "./";
        let type = query.type || "dirs";

        // 2. Security: Resolve path and prevent directory traversal
        // Adjust 'ROOT_SAFE_DIR' to the base folder users are allowed to see

        const absolutePath = resolve(parentDir);

        // Inside your try block...
        // inside your route
        const entries = await readdir(absolutePath, { withFileTypes: true });

        const items = entries
          .filter((entry) => (type !== "all" ? entry.isDirectory() : true))
          .map((entry) => ({
            name: entry.name,
            path: join(absolutePath, entry.name),
            isDirectory: entry.isDirectory(), // Helpful for the frontend to show icons
            size: null, // Optional: add stat() here if you need file sizes later
          }));

        return reply.send({
          currentPath: absolutePath,
          items: items, // renamed from 'directories' for clarity
        });
      } catch (err: any) {
        app.log.error(err);
        return reply
          .status(500)
          .send({ error: "Failed to list directories", message: err.message });
      }
    },
  );
}
