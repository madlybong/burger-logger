# @astrake/burger-logger

[![Bun](https://img.shields.io/badge/Bun-%3E=1.3-green?style=flat&logo=bun)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![NPM Version](https://img.shields.io/npm/v/@astrake/burger-logger.svg)](https://www.npmjs.com/package/@astrake/burger-logger)
[![Coverage](https://img.shields.io/badge/Coverage-99%25-brightgreen)](https://github.com/madlybong/burger-logger)
[![Publish](https://github.com/madlybong/burger-logger/actions/workflows/publish.yml/badge.svg)](https://github.com/madlybong/burger-logger/actions/workflows/publish.yml)

A **fast, async, non-blocking logger** optimized for Bun runtime. Built with TypeScript for seamless integration in Bun servers, APIs, or standalone scripts. Supports structured JSON logging, automatic file rotation (by size or time), colorized console output, and middleware for Bun's native `serve`. Zero dependencies, ~5KB minified.

Inspired by Winston but leaner and Bun-native – perfect for high-throughput apps like your burger-framework! 🍔

## Features
- **Log Levels**: Debug, Info, Warn, Error (configurable via options/env).
- **Outputs**: Console (with ANSI colors in debug mode) + File appending.
- **Structured Logging**: JSON format with timestamps, levels, and metadata objects.
- **Rotation**: Automatic by file size (MB) or interval (days, e.g., '1d'). Keeps N rotated files.
- **Non-Blocking**: Queue-based async writes to avoid event loop stalls.
- **Bun Integration**: Middleware for `serve` to log requests/responses/errors/durations.
- **Config**: Options object or env vars (e.g., `LOG_LEVEL=debug`).
- **Tested**: 99%+ coverage with Bun's test runner.

## Installation
```bash
bun add @astrake/burger-logger
```

Requires Bun >=1.3.0.

## Quick Start
### Standalone Logger
```typescript
import { BunLogger } from '@astrake/burger-logger';

const logger = new BunLogger({
  logLevel: 'debug',
  logToFile: true,
  filePath: './logs/app.log',
  structured: true,
  rotationSizeMB: 10,
  rotationInterval: '1d', // or 1 for 1 day
});

logger.info('App started! 🚀');
logger.info({ event: 'user_login', userId: 123 });
logger.error('Something went wrong', { code: 500 });

// Graceful flush on exit
await logger.flush();
```

### With Bun Server (Middleware)
```typescript
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
    return new Response('Burger served! 🍔');
  }),
});
```

**Output Example (Structured JSON)**:
```json
{"timestamp":"2025-10-15T12:34:56.789Z","level":"INFO","message":{"endpoint":"/api/users","method":"GET"}}
{"timestamp":"2025-10-15T12:34:57.012Z","level":"ERROR","message":{"error":"Test error"}}
```

## Configuration
Pass options to the constructor or use env vars (env overrides options).

| Option              | Type                  | Default       | Description |
|---------------------|-----------------------|---------------|-------------|
| `logLevel`         | `'debug' \| 'info' \| 'warn' \| 'error'` | `'info'`     | Minimum level to log. |
| `logToConsole`     | `boolean`            | `true`       | Output to console. |
| `logToFile`        | `boolean`            | `false`      | Append to file. |
| `filePath`         | `string`             | `'./app.log'`| Log file path. |
| `rotationSizeMB`   | `number`             | `10`         | Rotate when > N MB. |
| `rotationInterval` | `string \| number`   | `0` (disabled)| Rotate after N days ('1d' or 1). |
| `rotationCount`    | `number`             | `5`          | Max rotated files to keep. |
| `structured`       | `boolean`            | `false`      | JSON output (vs. plain text). |

**Env Vars** (e.g., in `.env` or shell):
```
LOG_LEVEL=debug
LOG_TO_FILE=true
LOG_FILE_PATH=./logs/custom.log
LOG_ROTATION_SIZE_MB=5
LOG_ROTATION_INTERVAL=1d
LOG_STRUCTURED=true
```

## API Reference
- `logger.debug/info/warn/error(msg: string | LogMessage)`: Log at level (async, fire-and-forget).
- `await logger.flush()`: Await queue processing (use on shutdown).
- `logger.middleware(fetchHandler)`: Wrap Bun fetch for auto-logging (req/url/status/duration/errors).

Full types exported for IDE support.

## Scripts
- `bun run build`: Compile TypeScript to `dist/`.
- `bun run typecheck`: Run TypeScript checks without emitting.
- `bun run test`: Run tests with coverage + typecheck.
- `bun run test:watch`: Watch mode for tests.
- `bun run dev`: Alias for test:watch.
- `npm run version:patch/minor/major`: Bump version and push tags.
- `npm run publish`: Test, build, and publish to npm.

## Development
Clone and setup:
```bash
git clone https://github.com/madlybong/burger-logger
cd burger-logger
bun install
```

- **Build**: `bun run build` (outputs to `dist/`).
- **Typecheck**: `bun run typecheck` (strict TS validation).
- **Test**: `bun test --coverage` (runs tests + coverage).
- **Watch**: `bun run dev`.

Uses Bun's built-in test runner; no extras needed.

## Contributing
Contributions are **very welcome**! burger-logger is in early stages—help make it even faster and more Bun-friendly.

### How to Contribute
1. Fork the repo.
2. Create a feature branch (`git checkout -b feat/amazing-feature`).
3. Commit changes (`git commit -m "Add amazing feature"`).
4. Push (`git push origin feat/amazing-feature`).
5. Open a Pull Request.

**Guidelines**:
- Follow TypeScript strict mode.
- Add tests for new features (aim for 95%+ coverage).
- Update README if needed.
- No breaking changes without discussion.

**Ideas Needed**:
- Custom transports (e.g., HTTP, DB).
- More levels/formats (e.g., timestamps, request IDs).
- Performance benchmarks vs. Winston/Pino.
- Bun-specific optimizations (e.g., WebSocket logs).

Join the conversation on GitHub Issues or Discussions!

## License
MIT © astrake (2025). See [LICENSE](LICENSE) for details.

## Acknowledgments
- Built on Bun's blazing-fast runtime.
- Inspired by Winston and Pino for core concepts.

---

⭐ **Star this repo if it saves you time!** Questions? Open an issue. Let's build awesome Bun apps together! 🍔