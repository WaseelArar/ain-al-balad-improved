// src/lib/database-migrations.js (or wherever you manage DB logic)

import { generateDateTime } from "../scripts/dateTime";

// Define your migrations in sequential order (version numbers must be sequential)
export const sqlite_migrations = [
  {
    version: 1,
    description: "basic_schema",
    sql: `

    -- Add date column with default value of current time
    CREATE TABLE IF NOT EXISTS regions (
      regionsId INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT
    );

    -- Issues

    CREATE TABLE IF NOT EXISTS issues (
        issuesId INTEGER PRIMARY KEY AUTOINCREMENT,
        usersId INTEGER NOT NULL,
        image TEXT,
        location TEXT,
        description TEXT,
        date DATETIME ,
        solved BOOLEAN DEFAULT 0,
        privateIssue BOOLEAN DEFAULT 0,
        FOREIGN KEY(usersId) REFERENCES users(usersId)

    );

    CREATE TABLE IF NOT EXISTS comments (
      commentsId  INTEGER PRIMARY KEY AUTOINCREMENT,
      issuesId INTEGER,
      usersId INTEGER NOT NULL,
      content TEXT,
      FOREIGN KEY(issuesId) REFERENCES issues(issuesId),
      FOREIGN KEY(usersId) REFERENCES users(usersId)
    );

    -- Users
    CREATE TABLE IF NOT EXISTS users (
        usersId INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        phone VARCHAR(20) ,
        role TEXT DEFAULT "USER",
        isActive BOOLEAN DEFAULT 1,
        regionsId INTEGER,
        FOREIGN KEY(regionsId) REFERENCES regions(regionsId)
    );
    -- Index for fast username lookups (Essential for Login)
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

    -- Index for fast regions lookups (Essential for Login)
    CREATE INDEX IF NOT EXISTS idx_users_regions ON regions(regionsId);

    -- Composite index for status and role (Great for Admin panels)
    CREATE INDEX IF NOT EXISTS idx_users_active_role ON users(isActive, role);


    `,
  },
  {
    version: 2,
    description: "add_date_to_comments",
    sql: `
      -- Add date column with default value of current time
      ALTER TABLE comments ADD COLUMN date DATETIME DEFAULT '${generateDateTime()}';

      -- Optional: Index for sorting comments by date
      CREATE INDEX IF NOT EXISTS idx_comments_date ON comments(date);
      `,
  },
  {
    version: 3,
    description: "add_date_to_user_creation",
    sql: `
      -- Add date column with default value of current time
      ALTER TABLE users ADD COLUMN createdAt DATETIME DEFAULT '${generateDateTime()}';
      ALTER TABLE users ADD COLUMN updatedAt DATETIME DEFAULT '${generateDateTime()}';

      -- Optional: Index for sorting comments by date
      CREATE INDEX IF NOT EXISTS idx_users_create_date ON users(createdAt);
      CREATE INDEX IF NOT EXISTS idx_users_update_date ON users(updatedAt);
      `,
  },


  {
    version: 4,
    description: "add_notifications_reactions_and_issue_enhancements",
    sql: `
      ALTER TABLE issues ADD COLUMN title TEXT DEFAULT '';
      ALTER TABLE issues ADD COLUMN updatedAt DATETIME;
      ALTER TABLE issues ADD COLUMN views INTEGER DEFAULT 0;

      CREATE TABLE IF NOT EXISTS notifications (
        notificationsId INTEGER PRIMARY KEY AUTOINCREMENT,
        usersId INTEGER NOT NULL,
        issuesId INTEGER,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        isRead BOOLEAN DEFAULT 0,
        createdAt DATETIME,
        FOREIGN KEY(usersId) REFERENCES users(usersId),
        FOREIGN KEY(issuesId) REFERENCES issues(issuesId)
      );

      CREATE TABLE IF NOT EXISTS reactions (
        reactionsId INTEGER PRIMARY KEY AUTOINCREMENT,
        issuesId INTEGER NOT NULL,
        usersId INTEGER NOT NULL,
        type TEXT DEFAULT 'confirm',
        createdAt DATETIME,
        UNIQUE(issuesId, usersId),
        FOREIGN KEY(issuesId) REFERENCES issues(issuesId),
        FOREIGN KEY(usersId) REFERENCES users(usersId)
      );

      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(usersId, isRead);
      CREATE INDEX IF NOT EXISTS idx_reactions_issue ON reactions(issuesId);
    `,
  },

  // Add new migrations here when you update your schema later
];

