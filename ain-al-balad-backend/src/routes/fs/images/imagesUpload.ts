import { type FastifyInstance } from "fastify";
import { pipeline } from "node:stream/promises";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import configStore from "../../../lib/server/serverConfig";
import CustomError from "../../../lib/classes/customError";

export default async function uploadRoutes(app: FastifyInstance) {
  // Ensure the directory exists

  const uploadDir = path.join(configStore.value.dataFolder, "public", "images");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  app.post(
    "/upload",
    {
      onRequest: [app.authenticate], // Ensure your admin hook is correctly registered
    },
    async (request, reply) => {
      // 1. Capture the multipart file stream
      const data = await request.file();

      if (!data) {
        throw new CustomError("لم يتم ارفاق صورة", 400);
      }

      // 2. Security: Check file type
      const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
      const extension = path.extname(data.filename).toLowerCase();

      if (!allowedExtensions.includes(extension)) {
        throw new CustomError("نوع الملف غير مدعوم", 400);
      }

      // 3. Generate unique filename
      const fileName = `${randomUUID()}${extension}`;
      const filePath = path.join(uploadDir, fileName);

      try {
        // 4. Stream the file directly to the disk
        await pipeline(data.file, fs.createWriteStream(filePath));

        // 5. Return the path that will be stored in your 'issues' table
        // This matches your frontend: const imageUrl = res.data.path;
        return {
          path: `/public/images/${fileName}`,
        };
      } catch (err) {
        app.log.error(err);
        return reply.code(500).send({ message: "فشل تحميل الصورة" });
      }
    },
  );
}
