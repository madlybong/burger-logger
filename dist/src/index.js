import { promises as fs } from "fs";
import process from "process";
import { dirname } from "path";
export class BunLogger {
    logLevel;
    logToConsole;
    logToFile;
    filePath;
    rotationSizeBytes;
    rotationIntervalMs;
    rotationCount;
    structured;
    levelMap = {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3,
    };
    colors = {
        debug: "\x1b[90m", // gray
        info: "\x1b[34m", // blue
        warn: "\x1b[33m", // yellow
        error: "\x1b[31m", // red
        reset: "\x1b[0m",
    };
    queue = [];
    isProcessing = false;
    constructor(options = {}) {
        const logLevelStr = options.logLevel || process.env.LOG_LEVEL || "info";
        this.logLevel = this.levelMap[logLevelStr.toLowerCase()] ?? 1; // Default to info if invalid
        this.logToConsole =
            options.logToConsole ??
                (process.env.LOG_TO_CONSOLE || "").toLowerCase() === "true";
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
        let interval = options.rotationInterval ?? process.env.LOG_ROTATION_INTERVAL ?? 0;
        if (typeof interval === "string") {
            interval = parseInt(interval.replace("d", ""), 10);
        }
        this.rotationIntervalMs = (Number(interval) || 0) * 24 * 60 * 60 * 1000; // days to ms, 0 disables
    }
    shouldLog(level) {
        return this.levelMap[level] >= this.logLevel;
    }
    async processQueue() {
        if (this.isProcessing || !this.logToFile || this.queue.length === 0)
            return;
        this.isProcessing = true;
        try {
            // Ensure directory exists
            await fs.mkdir(dirname(this.filePath), { recursive: true });
            while (this.queue.length > 0) {
                const message = this.queue.shift();
                await this.rotateIfNeeded();
                await fs.appendFile(this.filePath, message + "\n", "utf8");
            }
        }
        catch (error) {
            console.error(`Logger error: Failed to process queue - ${error}`);
        }
        finally {
            this.isProcessing = false;
        }
    }
    async fileExists(path) {
        try {
            await fs.access(path);
            return true;
        }
        catch {
            return false;
        }
    }
    async rotateIfNeeded() {
        if (!(await this.fileExists(this.filePath)))
            return;
        const stats = await fs.stat(this.filePath);
        const needsRotation = stats.size >= this.rotationSizeBytes ||
            (this.rotationIntervalMs > 0 &&
                Date.now() - stats.birthtimeMs >= this.rotationIntervalMs);
        if (!needsRotation)
            return;
        try {
            // Shift from highest to lowest
            for (let i = this.rotationCount; i >= 1; i--) {
                const oldPath = `${this.filePath}.${i}`;
                const newPath = `${this.filePath}.${i + 1}`;
                if (await this.fileExists(oldPath)) {
                    if (i === this.rotationCount) {
                        // Oldest: delete
                        await fs.unlink(oldPath);
                    }
                    else {
                        // Shift up
                        await fs.rename(oldPath, newPath);
                    }
                }
            }
            // Rename current to .1
            await fs.rename(this.filePath, `${this.filePath}.1`);
        }
        catch (error) {
            console.error(`Logger error: Failed to rotate log file - ${error}`);
        }
    }
    formatMessage(level, message) {
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
    getColoredMessage(level, message) {
        if (this.logLevel !== 0 || this.structured)
            return message; // Colorize only in debug mode and non-structured
        const color = this.colors[level] || "";
        return `${color}${message}${this.colors.reset}`;
    }
    log(level, message) {
        if (!this.shouldLog(level))
            return;
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
                this.processQueue().catch((error) => console.error(`Logger error: ${error}`));
            }
        }
    }
    debug(message) {
        this.log("debug", message);
    }
    info(message) {
        this.log("info", message);
    }
    warn(message) {
        this.log("warn", message);
    }
    error(message) {
        this.log("error", message);
    }
    async flush() {
        if (this.queue.length > 0) {
            await this.processQueue();
        }
    }
    middleware(fetch) {
        return async (req) => {
            const start = Date.now();
            let res;
            try {
                res = await fetch(req);
            }
            catch (error) {
                this.error({
                    error: error.message,
                    stack: error.stack,
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
