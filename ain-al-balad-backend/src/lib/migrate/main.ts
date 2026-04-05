import { Database } from "../classes/Database";
import { sqlite_migrations } from "./sqlite_migrations";
import { hash } from "../scripts/hash";

export const getDbVersion = async (db: Database) => {
  try {
    const version: { user_version: number } | undefined = await db.selectOne(
      "PRAGMA user_version;",
    );
    return version?.user_version ?? 0;
  } catch (error) {
    throw error;
  }
};

export const migrateDb = async (dbInstance: Database) => {
  try {
    let dbVersion = await getDbVersion(dbInstance);

    for (const migration of sqlite_migrations) {
      if (migration.version > dbVersion) {
        console.log(
          `🚀 Applying migration v${migration.version}: ${migration.description}`,
        );

        // Perform schema changes in a transaction
        await dbInstance.transaction(async (tx) => {
          const statements = migration.sql
            .split(";")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

          for (const stmt of statements) {
            await tx.execute(stmt);
          }
        });

        // Update version AFTER successful transaction
        // (Some SQLite drivers don't allow PRAGMA inside BEGIN/COMMIT)
        await dbInstance.execute(`PRAGMA user_version = ${migration.version}`);

        // Handle Seed Data (Default Admin)
        if (migration.version === 1) {
          const defaultHashedPassword = await hash("admin");
          await dbInstance.execute(
            "INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)",
            ["admin", defaultHashedPassword, "ADMIN"],
          );
          console.log("✅ Default admin user created.");
        }

        dbVersion = migration.version;
      }
    }
    console.log(`✨ Database is up to date (v${dbVersion}).`);
  } catch (error) {
    console.error("❌ Migration failed critical error:", error);
    throw error;
  }
};
