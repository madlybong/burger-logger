// import { promises as fs } from "fs";
// import process from "process";
// import { dirname } from "path";

// export interface LoggerOptions {
//   logLevel?: "debug" | "info" | "warn" | "error";
//   logToConsole?: boolean;
//   logToFile?: boolean;
//   filePath?: string;
//   rotationSizeMB?: number; // Max file size in MB before rotation
//   rotationInterval?: string | number; // e.g., '1d', 15 (days), 0 to disable
//   rotationCount?: number; // Max number of rotated files to keep
//   structured?: boolean; // Use structured (JSON) logging
// }

// export interface LogMessage {
//   [key: string]: any;
// }

// export class BunLogger {
//   private logLevel: number;
//   private logToConsole: boolean;
//   private logToFile: boolean;
//   private filePath: string;
//   private rotationSizeBytes: number;
//   private rotationIntervalMs: number;
//   private rotationCount: number;
//   private structured: boolean;

//   private levelMap: Record<string, number> = {
//     debug: 0,
//     info: 1,
//     warn: 2,
//     error: 3,
//   };

//   private colors: Record<string, string> = {
//     debug: "\x1b[90m", // gray
//     info: "\x1b[34m", // blue
//     warn: "\x1b[33m", // yellow
//     error: "\x1b[31m", // red
//     reset: "\x1b[0m",
//   };

//   private queue: string[] = [];
//   private isProcessing: boolean = false;

//   constructor(options: LoggerOptions = {}) {
//     const logLevelStr = options.logLevel || process.env.LOG_LEVEL || "info";
//     this.logLevel = this.levelMap[logLevelStr.toLowerCase()] ?? 1; // Default to info if invalid

//     this.logToConsole =
//       options.logToConsole ??
//       (process.env.LOG_TO_CONSOLE || "").toLowerCase() === "true";
//     this.logToFile =
//       options.logToFile ??
//       (process.env.LOG_TO_FILE || "").toLowerCase() === "true";
//     this.filePath =
//       options.filePath || process.env.LOG_FILE_PATH || "./app.log";
//     this.rotationSizeBytes =
//       (options.rotationSizeMB ||
//         Number(process.env.LOG_ROTATION_SIZE_MB) ||
//         10) *
//       1024 *
//       1024;
//     this.rotationCount =
//       options.rotationCount || Number(process.env.LOG_ROTATION_COUNT) || 5;
//     this.structured =
//       options.structured ??
//       (process.env.LOG_STRUCTURED || "").toLowerCase() === "true";

//     let interval =
//       options.rotationInterval ?? process.env.LOG_ROTATION_INTERVAL ?? 0;
//     if (typeof interval === "string") {
//       interval = parseInt(interval.replace("d", ""), 10);
//     }
//     this.rotationIntervalMs = (Number(interval) || 0) * 24 * 60 * 60 * 1000; // days to ms, 0 disables
//   }

//   private shouldLog(level: string): boolean {
//     return this.levelMap[level] >= this.logLevel;
//   }

//   private async processQueue(): Promise<void> {
//     if (this.isProcessing || !this.logToFile || this.queue.length === 0) return;
//     this.isProcessing = true;

//     try {
//       // Ensure directory exists
//       await fs.mkdir(dirname(this.filePath), { recursive: true });
//       while (this.queue.length > 0) {
//         const message = this.queue.shift()!;
//         await this.rotateIfNeeded();
//         await fs.appendFile(this.filePath, message + "\n", "utf8");
//       }
//     } catch (error) {
//       console.error(`Logger error: Failed to process queue - ${error}`);
//     } finally {
//       this.isProcessing = false;
//     }
//   }

//   private async fileExists(path: string): Promise<boolean> {
//     try {
//       await fs.access(path);
//       return true;
//     } catch {
//       return false;
//     }
//   }

//   private async rotateIfNeeded(): Promise<void> {
//     if (!(await this.fileExists(this.filePath))) return;

//     const stats = await fs.stat(this.filePath);
//     const needsRotation =
//       stats.size >= this.rotationSizeBytes ||
//       (this.rotationIntervalMs > 0 &&
//         Date.now() - stats.birthtimeMs >= this.rotationIntervalMs);

//     if (!needsRotation) return;

//     try {
//       // Shift from highest to lowest
//       for (let i = this.rotationCount; i >= 1; i--) {
//         const oldPath = `${this.filePath}.${i}`;
//         const newPath = `${this.filePath}.${i + 1}`;
//         if (await this.fileExists(oldPath)) {
//           if (i === this.rotationCount) {
//             // Oldest: delete
//             await fs.unlink(oldPath);
//           } else {
//             // Shift up
//             await fs.rename(oldPath, newPath);
//           }
//         }
//       }

//       // Rename current to .1
//       await fs.rename(this.filePath, `${this.filePath}.1`);
//     } catch (error) {
//       console.error(`Logger error: Failed to rotate log file - ${error}`);
//     }
//   }

//   private formatMessage(level: string, message: string | LogMessage): string {
//     const timestamp = new Date().toISOString();
//     if (this.structured) {
//       const logObject = {
//         timestamp,
//         level: level.toUpperCase(),
//         message: typeof message === "string" ? { msg: message } : message,
//       };
//       return JSON.stringify(logObject);
//     }
//     const msg = typeof message === "string" ? message : JSON.stringify(message);
//     return `[${timestamp}] [${level.toUpperCase()}] ${msg}`;
//   }

//   private getColoredMessage(level: string, message: string): string {
//     if (this.logLevel !== 0 || this.structured) return message; // Colorize only in debug mode and non-structured
//     const color = this.colors[level] || "";
//     return `${color}${message}${this.colors.reset}`;
//   }

//   private log(level: string, message: string | LogMessage): void {
//     if (!this.shouldLog(level)) return;
//     const formattedMessage = this.formatMessage(level, message);
//     if (this.logToConsole) {
//       // Use switch for type safety
//       switch (level) {
//         case "debug":
//           console.debug(this.getColoredMessage(level, formattedMessage));
//           break;
//         case "info":
//           console.info(this.getColoredMessage(level, formattedMessage));
//           break;
//         case "warn":
//           console.warn(this.getColoredMessage(level, formattedMessage));
//           break;
//         case "error":
//           console.error(this.getColoredMessage(level, formattedMessage));
//           break;
//         default:
//           console.log(this.getColoredMessage(level, formattedMessage));
//       }
//     }
//     if (this.logToFile) {
//       this.queue.push(formattedMessage);
//       if (!this.isProcessing) {
//         this.processQueue().catch((error) =>
//           console.error(`Logger error: ${error}`)
//         );
//       }
//     }
//   }

//   public debug(message: string | LogMessage): void {
//     this.log("debug", message);
//   }

//   public info(message: string | LogMessage): void {
//     this.log("info", message);
//   }

//   public warn(message: string | LogMessage): void {
//     this.log("warn", message);
//   }

//   public error(message: string | LogMessage): void {
//     this.log("error", message);
//   }

//   public async flush(): Promise<void> {
//     if (this.queue.length > 0) {
//       await this.processQueue();
//     }
//   }

//   public middleware(
//     fetch: (req: Request) => Promise<Response> | Response
//   ): (req: Request) => Promise<Response> {
//     return async (req: Request) => {
//       const start = Date.now();
//       let res: Response;
//       try {
//         res = await fetch(req);
//       } catch (error) {
//         this.error({
//           error: (error as Error).message,
//           stack: (error as Error).stack,
//         });
//         throw error;
//       }
//       const duration = Date.now() - start;
//       const logMsg = {
//         method: req.method,
//         url: req.url,
//         status: res.status,
//         duration: `${duration}ms`,
//       };
//       this.info(logMsg);
//       return res;
//     };
//   }
// }

import { promises as fs } from "fs";
import process from "process";
import { dirname } from "path";

export interface LoggerOptions {
  logLevel?: "debug" | "info" | "warn" | "error";
  logToConsole?: boolean;
  logToFile?: boolean;
  filePath?: string;
  rotationSizeMB?: number; // Max file size in MB before rotation
  rotationInterval?: string | number; // e.g., '1d', 15 (days), 0 to disable
  rotationCount?: number; // Max number of rotated files to keep
  structured?: boolean; // Use structured (JSON) logging
}

export interface LogMessage {
  [key: string]: any;
}

export class BunLogger {
  private logLevel: number;
  private logToConsole: boolean;
  private logToFile: boolean;
  private filePath: string;
  private rotationSizeBytes: number;
  private rotationIntervalMs: number;
  private rotationCount: number;
  private structured: boolean;

  private levelMap: Record<string, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  private colors: Record<string, string> = {
    debug: "\x1b[90m", // gray
    info: "\x1b[34m", // blue
    warn: "\x1b[33m", // yellow
    error: "\x1b[31m", // red
    reset: "\x1b[0m",
  };

  private queue: string[] = [];
  private isProcessing: boolean = false;

  constructor(options: LoggerOptions = {}) {
    const logLevelStr = options.logLevel || process.env.LOG_LEVEL || "info";
    this.logLevel = this.levelMap[logLevelStr.toLowerCase()] ?? 1; // Default to info if invalid

    this.logToConsole =
      options.logToConsole ??
      (process.env.LOG_TO_CONSOLE || "").toLowerCase() !== "false"; // Default to true unless explicitly false
    this.logToFile =
      options.logToFile ??
      (process.env.LOG_TO_FILE || "").toLowerCase() === "true";
    this.filePath =
      options.filePath || process.env.LOG_FILE_PATH || "./app.log";
    this.rotationSizeBytes =
      (options.rotationSizeMB ||
        Number(process.env.LOG_ROTATION_SIZE_MB) ||
        10) *
      1024 *
      1024;
    this.rotationCount =
      options.rotationCount || Number(process.env.LOG_ROTATION_COUNT) || 5;
    this.structured =
      options.structured ??
      (process.env.LOG_STRUCTURED || "").toLowerCase() === "true";

    let interval =
      options.rotationInterval ?? process.env.LOG_ROTATION_INTERVAL ?? 0;
    if (typeof interval === "string") {
      interval = parseInt(interval.replace("d", ""), 10);
    }
    this.rotationIntervalMs = (Number(interval) || 0) * 24 * 60 * 60 * 1000; // days to ms, 0 disables
  }

  private shouldLog(level: string): boolean {
    return this.levelMap[level] >= this.logLevel;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || !this.logToFile || this.queue.length === 0) return;
    this.isProcessing = true;

    try {
      // Ensure directory exists
      await fs.mkdir(dirname(this.filePath), { recursive: true });
      while (this.queue.length > 0) {
        const message = this.queue.shift()!;
        await this.rotateIfNeeded();
        await fs.appendFile(this.filePath, message + "\n", "utf8");
      }
    } catch (error) {
      console.error(`Logger error: Failed to process queue - ${error}`);
    } finally {
      this.isProcessing = false;
    }
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  private async rotateIfNeeded(): Promise<void> {
    if (!(await this.fileExists(this.filePath))) return;

    const stats = await fs.stat(this.filePath);
    const needsRotation =
      stats.size >= this.rotationSizeBytes ||
      (this.rotationIntervalMs > 0 &&
        Date.now() - stats.birthtimeMs >= this.rotationIntervalMs);

    if (!needsRotation) return;

    try {
      // Shift from highest to lowest
      for (let i = this.rotationCount; i >= 1; i--) {
        const oldPath = `${this.filePath}.${i}`;
        const newPath = `${this.filePath}.${i + 1}`;
        if (await this.fileExists(oldPath)) {
          if (i === this.rotationCount) {
            // Oldest: delete
            await fs.unlink(oldPath);
          } else {
            // Shift up
            await fs.rename(oldPath, newPath);
          }
        }
      }

      // Rename current to .1
      await fs.rename(this.filePath, `${this.filePath}.1`);
    } catch (error) {
      console.error(`Logger error: Failed to rotate log file - ${error}`);
    }
  }

  private formatMessage(level: string, message: string | LogMessage): string {
    const timestamp = new Date().toISOString();
    if (this.structured) {
      const logObject = {
        timestamp,
        level: level.toUpperCase(),
        message: typeof message === "string" ? { msg: message } : message,
      };
      return JSON.stringify(logObject);
    }
    const msg = typeof message === "string" ? message : JSON.stringify(message);
    return `[${timestamp}] [${level.toUpperCase()}] ${msg}`;
  }

  private getColoredMessage(level: string, message: string): string {
    const color = this.colors[level] || "";
    return `${color}${message}${this.colors.reset}`; // Always apply color if logToConsole is true
  }

  private log(level: string, message: string | LogMessage): void {
    if (!this.shouldLog(level)) return;
    const formattedMessage = this.formatMessage(level, message);
    if (this.logToConsole) {
      // Use switch for type safety
      switch (level) {
        case "debug":
          console.debug(this.getColoredMessage(level, formattedMessage));
          break;
        case "info":
          console.info(this.getColoredMessage(level, formattedMessage));
          break;
        case "warn":
          console.warn(this.getColoredMessage(level, formattedMessage));
          break;
        case "error":
          console.error(this.getColoredMessage(level, formattedMessage));
          break;
        default:
          console.log(this.getColoredMessage(level, formattedMessage));
      }
    }
    if (this.logToFile) {
      this.queue.push(formattedMessage);
      if (!this.isProcessing) {
        this.processQueue().catch((error) =>
          console.error(`Logger error: ${error}`)
        );
      }
    }
  }

  public debug(message: string | LogMessage): void {
    this.log("debug", message);
  }

  public info(message: string | LogMessage): void {
    this.log("info", message);
  }

  public warn(message: string | LogMessage): void {
    this.log("warn", message);
  }

  public error(message: string | LogMessage): void {
    this.log("error", message);
  }

  public async flush(): Promise<void> {
    if (this.queue.length > 0) {
      await this.processQueue();
    }
  }

  public middleware(
    fetch: (req: Request) => Promise<Response> | Response
  ): (req: Request) => Promise<Response> {
    return async (req: Request) => {
      const start = Date.now();
      let res: Response;
      try {
        res = await fetch(req);
      } catch (error) {
        this.error({
          error: (error as Error).message,
          stack: (error as Error).stack,
        });
        throw error;
      }
      const duration = Date.now() - start;
      const logMsg = {
        method: req.method,
        url: req.url,
        status: res.status,
        duration: `${duration}ms`,
      };
      this.info(logMsg);
      return res;
    };
  }
}
