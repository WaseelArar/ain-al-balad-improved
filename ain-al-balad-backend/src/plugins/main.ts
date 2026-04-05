import { type FastifyInstance } from "fastify";
import auth from "./auth";
import errorHandler from "./errorHandler";
import registerAuthMiddleWares from "./authMiddleWares";
import sqlite from "./sqlite";
import fastifyRateLimit from "@fastify/rate-limit";
import cors from "./cors";
import multipart from "./multipart";
import fastifyStaticPlugin from "./static";

export default async (fastify: FastifyInstance): Promise<void> => {
  await fastify.register(cors);
  await fastify.register(auth);
  await fastify.register(fastifyRateLimit);
  await fastify.register(errorHandler);
  await fastify.register(sqlite);
  await fastify.register(multipart);
  await fastify.register(fastifyStaticPlugin);
  await registerAuthMiddleWares(fastify);
};
