import { type FastifyInstance } from "fastify";

import postComment from "./postComment";
import getComments from "./getComments";

const issueSection = async (app: FastifyInstance) => {
  postComment(app);
  getComments(app);
};
export default issueSection;
