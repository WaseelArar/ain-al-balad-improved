import fastifyStatic from "@fastify/static";
import fp from "fastify-plugin";
import { type FastifyInstance } from "fastify";
import path from "path";
import configStore from "../lib/server/serverConfig";
import fs from "fs";

// Use resolve to ensure the bundler catches the absolute path during compilation
const distPath = path.resolve(import.meta.dir, "..", "..", "build");

const fastifyStaticPlugin = fp(
  async (fastify: FastifyInstance) => {
    const distExists = fs.existsSync(distPath);

    if (distExists) {
      // 1. Static Assets (Embedded in SFE)
      fastify.register(fastifyStatic, {
        root: distPath,
        prefix: "/",
        wildcard: false,
      });
      // 3. SPA Routing
      fastify.setNotFoundHandler(async (request, reply) => {
        if (request.url.startsWith("/api")) {
          return reply.code(404).send({ error: "Not Found" });
        }

        // Use Bun.file to read from the internal bundled path
        const indexFile = Bun.file(path.join(distPath, "index.html"));

        if (await indexFile.exists()) {
          const arrayBuffer = await indexFile.arrayBuffer();
          return reply.type("text/html").send(new Uint8Array(arrayBuffer));
        }

        return reply
          .code(404)
          .send({ error: "Index file not found in binary" });
      });
    }

    // 2. External User Data (On the HDD)
    fastify.register(fastifyStatic, {
      root: path.join(configStore.value.dataFolder, "public"),
      prefix: "/public/",
      decorateReply: false,
    });
  },
  { name: "staticPlugin" },
);

export default fastifyStaticPlugin;
