// tests/middleware.test.ts

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { BunLogger } from "../src/index";
import { readFileSync } from "fs";
import { join } from "path";
import { mkdir, rm } from "fs/promises";

describe("Middleware", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = join(process.cwd(), ".test-temp-middleware");
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("should log request/response details", async () => {
    const logPath = join(tempDir, "test-middleware.log");
    const logger = new BunLogger({
      logToConsole: false,
      logToFile: true,
      logLevel: "info" as const,
      filePath: logPath,
    });
    const fetch = async () => new Response("ok", { status: 200 });
    const middleware = logger.middleware(fetch);
    await middleware(new Request("http://localhost/test"));
    await Bun.sleep(10); // Allow processing
    await logger.flush();
    const content = readFileSync(logPath, "utf8");
    expect(content).toContain('method":"GET"');
    expect(content).toContain('url":"http://localhost/test"');
    expect(content).toContain('status":200');
    expect(content).toContain("duration");
  });

  it("should log errors and rethrow", async () => {
    const logPath = join(tempDir, "test-error.log");
    const logger = new BunLogger({
      logToConsole: false,
      logToFile: true,
      logLevel: "error" as const,
      filePath: logPath,
    });
    const fetch = async () => {
      throw new Error("handler fail");
    };
    const middleware = logger.middleware(fetch);
    await expect(middleware(new Request("http://localhost"))).rejects.toThrow(
      "handler fail"
    );
    await Bun.sleep(10); // Allow processing
    await logger.flush();
    const content = readFileSync(logPath, "utf8");
    expect(content).toContain('error":"handler fail"');
  });
});
