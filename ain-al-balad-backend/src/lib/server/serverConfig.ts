import minimist from "minimist";
import fs from "fs";
import path, { resolve } from "path";
import { tmpdir } from "os";

const args = minimist(process.argv.slice(2));
const tempFolder = tmpdir();
const PIDFILE = `${tempFolder}/ainalbalad.pid`;
const defaultDataFolder = path.join(process.cwd(), "ain-al-balad");
const datafolder = args.data ? resolve(args.data) : undefined;
const configFilePath = args.config
  ? resolve(args.config)
  : datafolder
    ? datafolder
    : defaultDataFolder;

if (configFilePath) {
  const configDir = path.dirname(configFilePath);
  if (!fs.existsSync(configDir)) {
    console.log("Error: Invalid config file path , doesn't exist!");
    process.exit(1);
  }
}
if (datafolder) {
  if (!fs.existsSync(datafolder)) {
    console.log("Error: Invalid data folder path , doesn't exist!");
    process.exit(1);
  }
} else {
  if (!fs.existsSync(defaultDataFolder)) {
    fs.mkdirSync(defaultDataFolder, { recursive: true });
  }
}

const DEFAULT_CONFIG_PATH = path.join(configFilePath, "server_config.json");

export interface ServerConfig {
  dataFolder: string;
  databaseName: string;
  currentDatabase?: string | undefined;
  port: number;
  verbose: boolean;
  backUpActive: boolean;
  backUpFolder?: string | undefined;
}
const defaults: ServerConfig = {
  dataFolder: defaultDataFolder,
  databaseName: "database.sqlite",
  port: 3000,
  verbose: false,
  backUpActive: false,
  backUpFolder: undefined,
};

if (args.help) {
  console.log("command --data [dataFolder] --config [configFile].json");
  console.log(`example config file
    {
    "dataFolder": "/home/user/Data",
    "databaseName": "database.sqlite",
    "port": 3000,
    "verbose": false,
    "backUpActive": false,
    "backUpFolder": "/home/user/Documents",
  }`);
  console.log(`
    Recomended: When you pass --data folder
    config file gets auto generated in the folder
    and used as default if no --config is passed`);
  console.log(`
    --data option will not override the dataFolder Option
    is the settings file only use this argument to initialize the config file`);

  process.exit(0);
}

// 1. Process Management
export function stopExisting() {
  if (fs.existsSync(PIDFILE)) {
    const pid = parseInt(fs.readFileSync(PIDFILE, "utf-8"), 10);
    try {
      process.kill(pid, "SIGTERM");
      // Synchronous busy-wait (max 2 seconds)
      const timeout = Date.now() + 2000;
      while (Date.now() < timeout) {
        try {
          process.kill(pid, 0); // Check if process still exists
        } catch {
          break; // Process is officially dead
        }
      }

      fs.unlinkSync(PIDFILE);
      return { success: true, message: "server killed successfully" };
    } catch {
      if (fs.existsSync(PIDFILE)) fs.unlinkSync(PIDFILE);
    }
  }
}

stopExisting();
if (args.kill) process.exit(0);

// 2. Initial File Logic
const configPath = resolve(args.config || DEFAULT_CONFIG_PATH);

if (!fs.existsSync(configPath)) {
  fs.writeFileSync(
    configPath,
    JSON.stringify(
      {
        ...defaults,
        dataFolder: datafolder,
      },
      null,
      2,
    ),
    "utf-8",
  );
}

let initialSettings: ServerConfig;
try {
  const fileContent = fs.readFileSync(configPath, "utf-8");
  initialSettings = JSON.parse(fileContent);
} catch (err) {
  console.warn("⚠️ Warning: Could not parse config file. Exsiting.");
  process.exit(1);
}

// 3. The Store Class
class ConfigStore {
  private state: ServerConfig;
  private listeners = new Set<(config: ServerConfig) => void>();

  constructor(initialState: ServerConfig) {
    // Merge initial file data with hardcoded defaults to ensure all keys exist
    this.state = { ...defaults, ...initialState };
    //this.state = { ...initialState };
  }

  // Get current config (Read-only copy)
  get value(): ServerConfig {
    return { ...this.state };
  }

  // Update config, save to file, and notify subscribers
  async set(updatedSettings: Partial<ServerConfig>) {
    // Prevent accidentally wiping out critical paths
    const newConfig = { ...this.state, ...updatedSettings };

    this.state = newConfig;

    try {
      await Bun.write(configPath, JSON.stringify(this.state, null, 2));
      this.listeners.forEach((callback) => callback(this.state));
    } catch (e) {
      console.error("Failed to save config:", e);
    }
  }

  // Subscribe to changes
  subscribe(callback: (config: ServerConfig) => void) {
    this.listeners.add(callback);
    // Return unsubscribe function
    return () => this.listeners.delete(callback);
  }
}

// 4. Initialize and Export
const configStore = new ConfigStore(initialSettings);

if (!configStore.value.dataFolder) {
  console.log("command --data [dataFolder] --config [configFile]");
  console.log(
    "you have to pass data folder or a config file with defined data folder settings",
  );
  console.log(`Recomended: When you pass --data folder
    config file gets auto generated in the folder
    and used as default if no --config is passed`);
  process.exit(0);
}

// Save current PID
fs.writeFileSync(PIDFILE, process.pid.toString(), "utf-8");

export default configStore;
