# Changelog

## [Unreleased]

### Added
- **`root`** constructor option: sandbox the instance; paths resolving outside it fail with `EACCES`
- **`readJson<T>(path)`** / **`writeJson(path, value, { spaces, atomic })`**; invalid JSON fails with `EJSON`
- **`atomic`** option on `writeFile`: write a temp file then rename it over the target
- **`ls(path, { recursive: true })`**
- **`isFile(path)`**, **`isDir(path)`** and **`chmod(path, mode)`**

### Fixed
- `move` across devices could delete the source after a failed copy when the instance had `force: true`

## [0.2.0-beta.0] - 2026-11-07

### Added
- **`writeFile(path, data, { append, encoding })`**: create, overwrite or append to a file
- **`exists(path)`** and **`stat(path)`**
- **`mkdir(path, { recursive: true })`**: create parents, no error if it exists (like `mkdir -p`)
- **`FileSystemError`** with `code` (errno-style), `operation`, `path` and `originalError`, exported with all option types and `LogLevel`
- Global `{ silent, force, logLevel }` defaults in the `FileSystem` constructor
- `silent` / `force` options on every command (including `cd`, `ls`, `touch`, `rename`, `readFile`)
- `readFile` returns `string` when `encoding` is set, `Buffer` otherwise (typed overloads)
- Package `exports` map; works from both ESM `import` and CommonJS `require`

### Changed
- **Breaking:** `silent` now only suppresses logging; use `force` to suppress throwing (previously `silent` did both)
- Errors wrapping Node failures are now formatted as `<operation>: <node message>`
- `delete`, `copy` (directories) and `move` use Node's `rmSync` / `cpSync`; symlinks are no longer followed when deleting
- Logger drops ANSI colors when output is not a TTY or `NO_COLOR` is set
- Requires Node.js >= 20

### Fixed
- `mkdir` / `touch` treated absolute paths as relative to the current directory
- Errors raised inside commands were re-wrapped and lost their original message

## [0.1.0-beta.2] - 2025-03-22

### Added
- **`copy(source: string, destination: string, options?: { recursive?: boolean, silent?: boolean })`**: Copy files or directories
- **`move(source: string, destination: string, options?: { recursive?: boolean, silent?: boolean, overwrite?: boolean })`**: Move files or directories with fallback to copy+delete when cross-device operations occur
- **`rename(oldPath: string, newPath: string, options?: { silent?: boolean })`**: Rename files or directories
- **`readFile(path: string, options?: { encoding?: BufferEncoding })`**: Read file contents with encoding options

### Changed
- **`delete`**: Improved error handling logic
- **`mkdir`**: Enhanced to support silent error option
- **`touch`**: Updated to support Buffer content for file creation
- **`Logger`**: Reworked logic with beautified colorized output

### Documentation
- Added comprehensive JSDoc comments to all methods
- Updated example usage in test files for better demonstration
- Added examples folder with usage examples

---

## [0.1.0-beta.1] - 2025-01-13

### Added
- **`mkdir(directory: string, options: { silent: boolean } = {})`**: Create a new directory.
- **`cd(directory: string)`**: Change the current working directory.
- **`ls()`**: List contents of the current directory.
- **`touch(file: string, content?: string | Buffer)`**: Create a new file.
- **`delete(target: string, options: { recursive?: boolean, silent: boolean, force?: boolean } = {})`**: Remove a file or directory.
- **`pwd()`**: Get the current working directory.

### Fixed

### Changed

### Removed

---

[Unreleased]: https://github.com/aallali/Sysify/compare/v0.1.0-beta.2...HEAD
[0.1.0-beta.2]: https://github.com/aallali/Sysify/compare/v0.1.0-beta.1...v0.1.0-beta.2
[0.1.0-beta.1]: https://github.com/aallali/Sysify/releases/tag/v0.1.0-beta.1
