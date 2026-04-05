import { type FastifyInstance } from "fastify";
import authSection from "./auth/main";
import fileSystemSection from "./fs/main";

import appSection from "./app/main";

const appRoutes = async (fastify: FastifyInstance) => {
  fileSystemSection(fastify);
  appSection(fastify);
  authSection(fastify);
};

export default appRoutes;
