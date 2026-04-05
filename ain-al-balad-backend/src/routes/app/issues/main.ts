import { type FastifyInstance } from "fastify";
import postIssue from "./postIssue";
import getIssues from "./getIssues";
import commentsSection from "./comments/main";
import toggleIssueSolved from "./toggleIssueSolved";

const issueSection = async (app: FastifyInstance) => {
  postIssue(app);
  getIssues(app);
  toggleIssueSolved(app);
  commentsSection(app);
};
export default issueSection;
