import { type FastifyInstance } from "fastify";
import fileExplorer from "./fileExplorer";
import configUpdater from "./configUpdater";
import uploadRoutes from "./images/imagesUpload";

const fileSystemSection = async (app: FastifyInstance) => {
  fileExplorer(app);
  configUpdater(app);
  uploadRoutes(app);
};

export default fileSystemSection;
