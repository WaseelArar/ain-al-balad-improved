import { type FastifyInstance } from "fastify";
import login from "./login";
import signup from "./signup";
import chpasswd from "./chpasswd";
import adminAction from "./users/main";
import { regionAdminRoutes } from "./regions/main";

export default async function (app: FastifyInstance) {
  login(app);
  signup(app);
  chpasswd(app);
  adminAction(app);
  regionAdminRoutes(app);
}
