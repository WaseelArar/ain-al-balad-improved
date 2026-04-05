import { Database as sqlite } from "bun:sqlite";

export class Database {
  private db: sqlite | null = null;

  constructor(dbUrl: string) {
    if (dbUrl) {
      this.db = new sqlite(dbUrl);
      // Immediate sync setup for vital pragmas
      this.db.run("PRAGMA journal_mode = WAL");
      this.db.run("PRAGMA busy_timeout = 9999");
      this.db.run("PRAGMA foreign_keys = ON;");
    }
  }

  // Wrapped in async to keep API consistent
  async load(dbUrl: string): Promise<void> {
    if (this.db) {
      this.db.close();
    }
    this.db = new sqlite(dbUrl);
  }

  /**
   * Execute a query (INSERT, UPDATE, DELETE)
   */
  async execute(query: string, params: any[] = []) {
    return new Promise<{ changes: number; lastInsertId: number }>(
      (resolve, reject) => {
        if (!this.db) return reject(new Error("Database not loaded"));
        try {
          const stmt = this.db.prepare(query);
          const result = stmt.run(...params);
          resolve({
            changes: result.changes,
            lastInsertId: result.lastInsertRowid as number,
          });
        } catch (err) {
          reject(err);
        }
      },
    );
  }

  /**
   * Select multiple rows
   */
  async select<T = any>(query: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error("Database not loaded"));
      try {
        const stmt = this.db.prepare(query);
        const results = stmt.all(...params);
        resolve(results as T[]);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Select a single row
   */
  async selectOne<T>(
    query: string,
    params: any[] = [],
  ): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error("Database not loaded"));
      try {
        const result = this.db.prepare(query).get(...params);
        resolve(result ? (result as T) : undefined);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Bun-native Transaction (still wrapped for async compatibility)
   */
  async transaction(fn: (db: Database) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error("Database not loaded"));
      try {
        const tx = this.db.transaction(() => fn(this));
        tx();
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
