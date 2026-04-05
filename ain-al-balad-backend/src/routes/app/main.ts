import { type FastifyInstance } from "fastify";
import issueSection from "./issues/main";
import notifications from "./notifications";
import reactions from "./reactions";
import stats from "./stats";

export default async (app: FastifyInstance) => {
  issueSection(app);
  notifications(app);
  reactions(app);
  stats(app);
};
