import { type FastifyInstance } from "fastify";

import getUsers from "./getUsers";
import deleteUsers from "./deleteUsers";
import chpasswd from "./chpasswd";
import chrole from "./chrole";
import chActive from "./chActive";

export default async function (app: FastifyInstance) {
  getUsers(app);
  deleteUsers(app);
  chpasswd(app);
  chrole(app);
  chActive(app);
}
