export interface LoggerOptions {
    logLevel?: "debug" | "info" | "warn" | "error";
    logToConsole?: boolean;
    logToFile?: boolean;
    filePath?: string;
    rotationSizeMB?: number;
    rotationInterval?: string | number;
    rotationCount?: number;
    structured?: boolean;
}
export interface LogMessage {
    [key: string]: any;
}
export declare class BunLogger {
    private logLevel;
    private logToConsole;
    private logToFile;
    private filePath;
    private rotationSizeBytes;
    private rotationIntervalMs;
    private rotationCount;
    private structured;
    private levelMap;
    private colors;
    private queue;
    private isProcessing;
    constructor(options?: LoggerOptions);
    private shouldLog;
    private processQueue;
    private fileExists;
    private rotateIfNeeded;
    private formatMessage;
    private getColoredMessage;
    private log;
    debug(message: string | LogMessage): void;
    info(message: string | LogMessage): void;
    warn(message: string | LogMessage): void;
    error(message: string | LogMessage): void;
    flush(): Promise<void>;
    middleware(fetch: (req: Request) => Promise<Response> | Response): (req: Request) => Promise<Response>;
}
