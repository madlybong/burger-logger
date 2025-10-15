# Changelog

All notable changes to `burger-logger` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.15] - 2025-10-15

### Added

- Initial release of `burger-logger`, a fast, async, non-blocking logger for Bun.
- Log levels: `debug`, `info`, `warn`, `error`.
- Console output with ANSI colors (debug mode, non-structured).
- File logging with async queue-based writes.
- Structured JSON logging option.
- Automatic log rotation by size (MB) or time interval (days, e.g., '1d').
- Middleware for Bun's `serve` to log requests, responses, and errors.
- Environment variable support for configuration (e.g., `LOG_LEVEL`, `LOG_TO_FILE`).
- TypeScript support with full type definitions.
- Comprehensive tests with 99%+ coverage using Bun's test runner.
- GitHub Actions workflow for auto-publishing to npm on tagged pushes (`v*`).

### Fixed

- Resolved file writing issues for reliable log file creation.
- Ensured async queue processing with proper flush mechanics.
- Fixed TypeScript errors for strict type safety.
