import fastifyCors from "@fastify/cors";
import fp from "fastify-plugin";
import { type FastifyInstance } from "fastify";

export default fp(
  async (fastify: FastifyInstance) => {
    fastify.register(fastifyCors, {
      // 1. Explicitly list allowed origins (Required when credentials: true)
      origin: true,
      // 2. Enable the Access-Control-Allow-Credentials header
      //credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      //allowedHeaders: ["Content-Type", "Authorization"],
      // Optional: Set success status for legacy browser preflights
      optionsSuccessStatus: 200,
    });
  },
  { name: "corsPlugin" },
);
