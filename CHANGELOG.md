# Changelog

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

[0.1.0-beta.2]: https://github.com/aallali/Sysify/compare/v0.1.0-beta.1...v0.1.0-beta.2
[0.1.0-beta.1]: https://github.com/aallali/Sysify/releases/tag/v0.1.0-beta.1
