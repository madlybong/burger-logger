# 🍔 @astrake/burger-logger

[![Bun](https://img.shields.io/badge/Bun-%3E=1.3-green?style=flat&logo=bun)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![NPM Version](https://img.shields.io/npm/v/@astrake/burger-logger.svg)](https://www.npmjs.com/package/@astrake/burger-logger)
[![Coverage](https://img.shields.io/badge/Coverage-99%25-brightgreen)](https://github.com/madlybong/burger-logger)

> A **fast, async, non-blocking logger** optimized for the [Bun](https://bun.sh) runtime.  
> Written in TypeScript, designed for structured logs, file rotation, and high throughput.  
> Perfect companion for APIs, servers, and frameworks like your burger-framework! 🍟

Zero dependencies, ~5 KB minified.

---

## ✨ Features

- **Log Levels:** `debug`, `info`, `warn`, `error`
- **Outputs:** Console (colorized) + File
- **Structured JSON:** Timestamped logs with metadata
- **Rotation:** Auto by file size or interval (e.g., `10MB`, `1d`)
- **Non-blocking:** Queued async writes — zero event-loop blocking
- **Middleware:** Plug directly into Bun’s native `serve`
- **Configurable:** Use options or env vars
- **Tested:** > 99 % coverage using Bun’s test runner
- **Type-safe:** Fully typed API and constructor options

---

## 🧩 Installation

```bash
bun add @astrake/burger-logger
```

Requires **Bun ≥ 1.3.0**

---

## 🚀 Quick Start

### Standalone Logger

```ts
import { BunLogger } from '@astrake/burger-logger';

const logger = new BunLogger({
  logLevel: 'debug',
  logToFile: true,
  filePath: './logs/app.log',
  structured: true,
  rotationSizeMB: 10,
  rotationInterval: '1d',
});

logger.info('App started 🚀');
logger.info({ event: 'user_login', userId: 123 });
logger.error('Something went wrong', { code: 500 });

// Graceful shutdown
await logger.flush();
```

### Middleware for Bun Server

```ts
import { serve } from 'bun';
import { BunLogger } from '@astrake/burger-logger';

const logger = new BunLogger({
  logToFile: true,
  filePath: './logs/server.log',
  structured: true,
});

serve({
  port: 3000,
  fetch: logger.middleware(async (req) => {
    logger.info({ endpoint: req.url, method: req.method });
    if (req.url.endsWith('/error')) throw new Error('Test error');
    return new Response('Burger served 🍔');
  }),
});
```

#### Example (Structured JSON Output)
```json
{"timestamp":"2025-10-15T09:53:23.456Z","level":"INFO","message":{"endpoint":"/api/users","method":"GET"}}
{"timestamp":"2025-10-15T09:53:23.789Z","level":"ERROR","message":{"error":"Test error"}}
```

---

## ⚙️ Configuration

Use constructor options or environment variables (env vars override options).

| Option              | Type                              | Default        | Description |
|---------------------|-----------------------------------|----------------|--------------|
| `logLevel`          | `'debug' \| 'info' \| 'warn' \| 'error'` | `'info'` | Minimum level to log |
| `logToConsole`      | `boolean`                         | `true`         | Output to console |
| `logToFile`         | `boolean`                         | `false`        | Append logs to file |
| `filePath`          | `string`                          | `'./app.log'`  | Path to log file |
| `rotationSizeMB`    | `number`                          | `10`           | Rotate after N MB |
| `rotationInterval`  | `string \| number`                | `0`            | Rotate after N days (e.g., `'1d'` or `1`) |
| `rotationCount`     | `number`                          | `5`            | Keep N rotated files |
| `structured`        | `boolean`                         | `false`        | Enable JSON output |

### Environment Variables

```bash
LOG_LEVEL=debug
LOG_TO_FILE=true
LOG_FILE_PATH=./logs/custom.log
LOG_ROTATION_SIZE_MB=5
LOG_ROTATION_INTERVAL=1d
LOG_STRUCTURED=true
```

---

## 🧠 API Reference

- `logger.debug/info/warn/error(message: string | LogMessage)`  
  Async fire-and-forget logging.
- `await logger.flush()`  
  Await all pending writes before shutdown.
- `logger.middleware(fetchHandler)`  
  Wraps a Bun `fetch` handler for automatic request/response/error logging.

Types are fully exported for IDE auto-completion.

---

## 🧰 Scripts

| Command | Description |
|----------|--------------|
| `bun run build` | Compile TypeScript to `dist/` |
| `bun run typecheck` | Run type checks only |
| `bun run test` | Run tests with coverage |
| `bun run test:watch` | Watch mode for tests |
| `bun run dev` | Alias for `test:watch` |
| `npm run version:patch/minor/major` | Version bump utilities |
| `bun run release` | Full automated test + build + publish flow |

---

## 🧱 Releasing a new version

Automate testing, building, versioning, and publishing with one command.

```bash
bun run release
```

This will:

- Run all tests and type checks  
- Build the project  
- Bump the patch version  
- Commit the change  
- Publish to npm (with `--ignore-scripts` to prevent recursion)  
- Create a Git tag `vX.Y.Z` and push with `--follow-tags`

To preview contents before publishing:

```bash
npm publish --dry-run
```

---

## 🧑‍💻 Development

```bash
git clone https://github.com/madlybong/burger-logger
cd burger-logger
bun install
```

Run commands:

```bash
bun run build
bun run typecheck
bun test --coverage
```

Uses Bun’s built-in test runner — no extra setup required.

---

## 🤝 Contributing

Contributions are **very welcome** — Burger Logger is early but stable.

**Steps**

1. Fork the repo  
2. Create a feature branch  
3. Commit your changes  
4. Push and open a PR

**Guidelines**

- Follow strict TypeScript mode  
- Maintain 95 %+ test coverage  
- Update README if applicable  
- Discuss before breaking changes  

**Ideas for future work**

- Custom transports (HTTP, DB, WebSocket)  
- Correlation IDs or request-context tracing  
- Performance benchmarks vs. Pino/Winston  
- Log compression or daily rollovers  

---

## 📜 License

MIT © [Anuvab Chakraborty](mailto:madlybong@gmail.com) — see [LICENSE](LICENSE)

---

## 🙌 Acknowledgments

- Built on the lightning-fast [Bun runtime](https://bun.sh)  
- Inspired by Winston & Pino  
- Maintained under the **Astrake** namespace

---

⭐ **Star this repo** if it saved you time — let’s make Bun’s ecosystem better together! 🍔
