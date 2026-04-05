import configStore from "./serverConfig";
import { subMonths, isBefore, parse, format, isValid } from "date-fns";
import { write, file } from "bun";
import fs from "fs";
import path from "path";
import { Database } from "../classes/Database";

async function checkWritePermission(dirPath: string) {
  const testFile = `${dirPath}/.perm_test_${Date.now()}`;
  try {
    // Attempt to create a dummy file
    await write(testFile, "test");
    // If successful, delete the test file
    await file(testFile).delete();
    return true; // Writable
  } catch (error) {
    console.error("Write permission denied:", error);
    return false; // Not writable
  }
}

export const updateBackUpFolder = async (folder: string) => {
  try {
    const folderExists = fs.existsSync(folder);
    if (!folderExists) throw new Error("Error: Folder Not Found");
    const isWritable = await checkWritePermission(folder);
    if (!isWritable) throw new Error("Error: Selected Folder Is ReadOnly !");
    configStore.set({ backUpFolder: folder });
  } catch (err: any) {
    throw err;
  }
};

export const loadTemporaryDb = async (path: string | undefined = undefined) => {
  try {
    if (path) {
      const dbExists = fs.existsSync(path);
      if (!dbExists) throw new Error("Error: Unable To Find Database File !");
    }
    configStore.set({ currentDatabase: path });
  } catch (err: any) {
    throw err;
  }
};

export const updateDataFolder = async (db: Database, folder: string) => {
  const oldPath = path.join(
    configStore.value.dataFolder ?? "",
    configStore.value.databaseName,
  );
  const newPath = path.join(folder, configStore.value.databaseName);
  db.close();
  try {
    if (!fs.existsSync(folder)) throw new Error("Error: Folder Not Found");
    if (!(await checkWritePermission(folder)))
      throw new Error("Error: Folder Is ReadOnly!");

    try {
      fs.renameSync(oldPath, newPath);
    } catch (err: any) {
      if (err.code === "EXDEV") {
        // Cross-device link error
        fs.copyFileSync(oldPath, newPath);
        fs.unlinkSync(oldPath);
      } else {
        throw err;
      }
    }
    // Update config after successful move
    configStore.set({ dataFolder: folder });
  } catch (err: any) {
    throw err;
  }
};

export const copyDatabaseFile = async (db: Database, dist: string) => {
  try {
    const settings = configStore.value;
    db.close();
    fs.copyFileSync(
      path.join(
        configStore.value.dataFolder ?? "",
        configStore.value.databaseName,
      ),
      path.join(dist, configStore.value.databaseName),
    );
    db.load(
      settings.currentDatabase ??
        path.join(settings.dataFolder ?? "", settings.databaseName),
    );
  } catch (err: any) {
    throw err;
  }
};

export const createDatabaseWithName = async (name: string) => {
  try {
    const dbName = `${name}.sqlite`;
    configStore.set({ databaseName: dbName });
  } catch (err: any) {
    throw err;
  }
};

export const setPersistentDatabase = async () => {
  try {
    const temporaryDbFile = configStore.value.currentDatabase;
    if (!temporaryDbFile) return;
    else {
      const dir = path.dirname(temporaryDbFile);
      const file = path.basename(temporaryDbFile);
      configStore.set({
        dataFolder: dir,
        databaseName: file,
        currentDatabase: undefined,
      });
    }
  } catch (err: any) {
    throw err;
  }
};

export const cleanOldBackUps = async () => {
  try {
    const settings = configStore.value;
    const backUpFolder = settings.backUpFolder;
    if (!backUpFolder) return;
    const resolvedBackupBase = path.resolve(backUpFolder);
    const currentDbDir = path.resolve(settings.dataFolder ?? "");

    const expiryDate = subMonths(new Date(), 1);

    const entries = await fs.promises.readdir(resolvedBackupBase, {
      withFileTypes: true,
    });
    const destructionList: string[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const folderDate = parse(entry.name, "yyyy-MM-dd", new Date());
      if (isValid(folderDate) && isBefore(folderDate, expiryDate)) {
        const elemenatedDir = path.join(resolvedBackupBase, entry.name);
        if (elemenatedDir !== currentDbDir) destructionList.push(elemenatedDir);
      }
    }
    //console.log(destructionList);
    for (const dir of destructionList) {
      console.log("deleting Backup: " + dir);
      await fs.promises.rm(dir, { recursive: true });
    }
  } catch (err: any) {
    throw err;
  }
};

export const createDbBackup = async (db: Database) => {
  let dbWasClosed = false;
  try {
    const settings = configStore.value;
    const dateTime = format(new Date(), "yyyy-MM-dd");
    const dbPath = path.join(settings.dataFolder ?? "", settings.databaseName);
    if (!dbPath) throw new Error("خطأ: تعذر الوصول لقاعدة البيانات الرئيسية!");
    const backUpFolder = settings.backUpFolder;
    const databaseName = settings.databaseName;
    if (!backUpFolder)
      throw new Error("خطأ: تعذر الوصول لموقع النسخ الاحتياطي");
    const folderExists = fs.existsSync(backUpFolder);
    if (!folderExists)
      throw new Error("خطأ: تعذر الوصول لموقع النسخ الاحتياطي");
    const timestamp = format(new Date(), "HH-mm-ss");
    const backUpName = `${timestamp}_${databaseName}`;
    const destDir = path.join(backUpFolder, dateTime);
    fs.mkdirSync(destDir, {
      recursive: true, // Set to true to create parent directories if they don't exist
    });
    console.log(`Directory created at ${destDir}`);
    const destFile = path.join(destDir, backUpName);
    //isBackupInProgress = true;
    db.close();
    dbWasClosed = true;
    fs.copyFileSync(dbPath, destFile);

    // 5. Cleanup - logic only runs if backup didn't crash before this
    await cleanOldBackUps().catch((e) => console.error("Cleanup failed:", e));
  } catch (err: any) {
    //if (alert) alert(err);
    console.log(err);
    throw err;
  } finally {
    // 4. ALWAYS try to reload the database if we closed it,
    // even if the copy failed.
    if (dbWasClosed) {
      const settings = configStore.value;
      const originalPath =
        settings.currentDatabase ??
        path.join(settings.dataFolder ?? "", settings.databaseName);
      db.load(originalPath);
    }
  }
};

export const updateDatabaseName = async (db: Database, name: string) => {
  const settings = configStore.value;
  const dbName = name.endsWith(".sqlite") ? name : `${name}.sqlite`;
  const oldPath = path.join(settings.dataFolder ?? "", settings.databaseName);
  const newPath = path.join(settings.dataFolder ?? "", dbName);

  try {
    db.close();
    fs.renameSync(oldPath, newPath);
    configStore.set({ databaseName: dbName });
  } catch (err: any) {
    // 🛡️ Recovery: If renaming failed, reload the original DB
    // so the server doesn't stay in a "disconnected" state.
    db.load(oldPath);
    throw err;
  }
};
