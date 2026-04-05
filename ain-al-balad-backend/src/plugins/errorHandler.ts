import fp from "fastify-plugin";
import { type FastifyInstance } from "fastify";

export default fp(
  async (fastify: FastifyInstance) => {
    fastify.setErrorHandler((error: any, request, reply) => {
      // Log error locally
      request.log.error(error);

      // Fallback for standard errors
      reply.status(error.statusCode ?? 500).send({
        success: false,
        error: error.message ?? "ServerError",
        message: error.message ?? "Internal Server Error",
      });
    });
  },
  { name: "errorhandlerPlugin" },
);
