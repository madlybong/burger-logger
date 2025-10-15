# Changelog

All notable changes to `@astrake/burger-logger` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.16] - 2025-10-15

### Added
- GitHub Actions workflow for automatic npm publishing on tagged pushes (`v*`).
- GitHub Actions badge in README.
- CHANGELOG.md for release tracking.

### Fixed
- Ensured log file directory creation to prevent ENOENT warnings during tests.
- Excluded test files from published npm package (`dist/tests/`).
- Updated package scope to `@astrake/burger-logger` in README and package.json.

## [0.0.15] - 2025-10-15

### Added
- Initial release of `@astrake/burger-logger`, a fast, async, non-blocking logger for Bun.
- Log levels: `debug`, `info`, `warn`, `error`.
- Console output with ANSI colors (debug mode, non-structured).
- File logging with async queue-based writes.
- Structured JSON logging option.
- Automatic log rotation by size (MB) or time interval (days, e.g., '1d').
- Middleware for Bun's `serve` to log requests, responses, and errors.
- Environment variable support for configuration (e.g., `LOG_LEVEL`, `LOG_TO_FILE`).
- TypeScript support with full type definitions.
- Comprehensive tests with 99%+ coverage using Bun's test runner.

### Fixed
- Resolved file writing issues for reliable log file creation.
- Ensured async queue processing with proper flush mechanics.
- Fixed TypeScript errors for strict type safety.