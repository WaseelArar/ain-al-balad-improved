import multipart from "@fastify/multipart";
import fp from "fastify-plugin";
import { type FastifyInstance } from "fastify";

export default fp(
  async (fastify: FastifyInstance) => {
    // Add this before your routes
    fastify.register(multipart, {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    });
  },
  { name: "multipartPlugin" },
);
