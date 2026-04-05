import { type FastifyInstance } from "fastify";
import { type FastifyReply } from "fastify/types/reply";
import { type FastifyRequest } from "fastify/types/request";

export default async (fastify: FastifyInstance) => {
  // 3. Define the Global Decorator
  fastify.decorate(
    "getuser",
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        // jwtVerify() automatically looks in the "token" cookie due to config above
        await request.jwtVerify();
      } catch (err) {
        //reply.code(401).send(err);
      }
    },
  );
  fastify.decorate(
    "authenticate",
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        // jwtVerify() automatically looks in the "token" cookie due to config above
        await request.jwtVerify();
      } catch (err) {
        reply.code(401).send(err);
      }
    },
  );
  //4. Admin-only authentication
  fastify.decorate(
    "admin",
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        await request.jwtVerify();
        if (request.user.role !== "ADMIN") {
          reply.code(403).send({ error: "Forbidden: Admins only" });
        }
      } catch (err) {
        reply.code(401).send({ error: "Unauthorized" });
      }
    },
  );
};
