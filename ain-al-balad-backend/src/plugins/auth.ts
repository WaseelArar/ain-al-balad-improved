import fp from "fastify-plugin";
import { type FastifyInstance } from "fastify";
import fastifyJwt from "@fastify/jwt";
//import fastifyCookie from "@fastify/cookie";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      usersId: number;
      username: string;
      role: string;
      regionsId?: number;
      regionsName?: string;
    }; // what you sign
    user: {
      usersId: number;
      username: string;
      role: string;
      regionsId?: number;
      regionsName?: string;
    }; // what you get after verify
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
    admin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    getuser: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(
  async (fastify: FastifyInstance) => {
    // 1. Register Cookies first (required by JWT cookie support)

    /*app.register(fastifyCookie, {
    secret: "supersecret",
    parseOptions: {
      httpOnly: true,
      secure: false, // allow cookies over HTTP during dev
      sameSite: "lax", // allow cookies on cross-site GETs and POSTs
      path: "/",
    },
  });*/ // plugin option (for signed cookies) parseOptions: {} // optional: global parse options

    // 2. Register JWT with Cookie support
    fastify.register(fastifyJwt, {
      secret: process.env.JWT_SECRET || "supersecret", // Always use env in 2026
      /*cookie: {
      cookieName: "token",
      signed: false,
      },*/
    });
  },
  { name: "authPlugin" },
);
