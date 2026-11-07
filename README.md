# Sysify

**✨ A Lightweight, TypeScript-Powered File System Wrapper for Node.js ✨**

[![📘 TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![🟢 Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![📜 License](https://img.shields.io/badge/License-MIT-blue)](https://opensource.org/licenses/MIT) 
[![📦 npm](https://img.shields.io/npm/v/sysify)](https://www.npmjs.com/package/sysify)
[![🐛 GitHub Issues](https://img.shields.io/github/issues/aallali/sysify)](https://github.com/aallali/sysify/issues)
[![⭐ GitHub Stars](https://img.shields.io/github/stars/aallali/sysify)](https://github.com/aallali/sysify/stargazers)
[![🔗 GitHub Forks](https://img.shields.io/github/forks/aallali/sysify)](https://github.com/aallali/sysify/network/members)
[![🔧 codecov](https://codecov.io/github/aallali/Sysify/graph/badge.svg?token=M5NQEJ0TXB)](https://codecov.io/github/aallali/Sysify)

**`Sysify`** is a lightweight yet powerful wrapper for the Node.js filesystem module, providing an intuitive and typed API for essential terminal-like commands. It’s designed to enable developers to write scripts for managing files and directories quickly and efficiently.

With `Sysify`, you can leverage commands like `mkdir`, `cd`, `ls`, `touch`, `rm`, and more in a way that feels natural to developers familiar with terminal commands.

---

## ✨ Features

- **📂 Terminal-like commands**: `mkdir`, `cd`, `ls`, `touch`, `delete`, `copy`, `move`, `rename`, `readFile`, `writeFile`, `readJson`, `writeJson`, `chmod`, `exists`, `isFile`, `isDir`, `stat`.
- **📍 Own working directory**: `cd` changes the instance's directory, never `process.cwd()`.
- **⚡ Sync or async**: same API as Promises from `sysify/promises`.
- **🔒 Optional sandbox**: `new FileSystem({ root })` rejects any path outside `root`.
- **💾 Atomic writes**: `writeFile`/`writeJson` with `{ atomic: true }` never leave a half-written file.
- **🛡️ Predictable errors**: every failure is a `FileSystemError` with an errno-style `code` (`ENOENT`, `EEXIST`, ...).
- **🔇 `silent` / `force` everywhere**: choose per call (or globally) whether errors are logged and whether they throw.
- **📚 Fully typed**: TypeScript types and JSDoc for every method; works from ESM and CommonJS.
- **🪶 Zero dependencies.**

---

## 📥 Installation

Requires Node.js 20 or later.

```bash
npm install sysify
# or
pnpm add sysify
```

---

## 🚀 Quick Start

```typescript
import { FileSystem } from 'sysify' // or: const { FileSystem } = require('sysify')

const fs = new FileSystem()

fs.mkdir('projects/demo', { recursive: true }) // mkdir -p
fs.cd('projects/demo')

fs.touch('readme.txt', 'Welcome to Sysify!') // fails if the file exists
fs.writeFile('log.txt', 'line 1\n') // create or overwrite
fs.writeFile('log.txt', 'line 2\n', { append: true })

console.log(fs.ls()) // ['log.txt', 'readme.txt']
console.log(fs.readFile('log.txt', { encoding: 'utf8' })) // string
console.log(fs.readFile('readme.txt')) // Buffer

fs.cd('../..')
fs.delete('projects', { recursive: true }) // rm -r
```

### Async

Every command is also available as a Promise from `sysify/promises`, with the same options, error codes and messages:

```typescript
import { FileSystem } from 'sysify/promises'

const fs = new FileSystem()
await fs.mkdir('projects/demo', { recursive: true })
await fs.cd('projects/demo')
await fs.writeJson('config.json', { debug: true }, { atomic: true })
console.log(await fs.ls()) // ['config.json']
```

`pwd()` and `getLogger()` stay synchronous. The working directory belongs to the instance, so don't run `cd` at the same time as other commands on the same instance.

---

## 🔧 API

Paths can be absolute or relative to `pwd()`. Every command also accepts `silent` and `force` (see [Error handling](#-error-handling)).

| Method | Description | Extra options |
| --- | --- | --- |
| `pwd()` | Current working directory (starts at `process.cwd()`) | |
| `cd(dir)` | Change directory (falls back to a case-insensitive match) | |
| `ls(dir?, opts?)` | List entries; directories end with `/` | `recursive` |
| `exists(path)` | `true` if the path exists, never throws | |
| `isFile(path)` / `isDir(path)` | Type checks, never throw | |
| `stat(path)` | `fs.Stats` (size, mode, dates, `isFile()`, ...) | |
| `chmod(path, mode)` | Change permissions (`0o755` or `'755'`) | |
| `mkdir(dir, opts?)` | Create a directory | `recursive` |
| `touch(file, content?)` | Create a **new** file (string or `Buffer`) | |
| `writeFile(file, data, opts?)` | Create or overwrite a file | `append`, `encoding`, `atomic` |
| `readFile(file, opts?)` | `string` with `encoding`, otherwise `Buffer` | `encoding`, `flag` |
| `readJson<T>(file)` | Read and parse JSON (`EJSON` if invalid) | |
| `writeJson(file, value, opts?)` | Write pretty JSON + trailing newline | `spaces`, `atomic` |
| `copy(src, dest, opts?)` | Copy a file or directory | `recursive`, `overwrite` |
| `move(src, dest, opts?)` | Move (copy + delete across devices) | `overwrite` |
| `rename(old, new)` | Rename; never replaces an existing path | |
| `delete(path, opts?)` | Delete a file or directory | `recursive` |
| `getLogger()` | Access the instance's logger | |

---

## 🛡️ Error handling

Failures throw a `FileSystemError`:

```typescript
import { FileSystem, FileSystemError } from 'sysify'

try {
  fs.readFile('missing.txt')
} catch (err) {
  if (err instanceof FileSystemError && err.code === 'ENOENT') {
    // err.message   -> "readFile: cannot read 'missing.txt': No such file or directory"
    // err.operation -> 'readFile'
    // err.path      -> 'missing.txt'
    // err.originalError -> the underlying Node error, when there is one
  }
}
```

| Option | Default | Effect |
| --- | --- | --- |
| `silent` | `false` | Don't log the error |
| `force` | `false` | Don't throw; return a fallback (`[]` for `ls`, `undefined` for `stat`/`readJson`, empty `string`/`Buffer` for `readFile`) |

Set them per call, or as defaults for the whole instance:

```typescript
const fs = new FileSystem({ silent: true, force: true, logLevel: 'error' })
fs.ls('maybe-missing') // [] instead of throwing
fs.ls('must-exist', { force: false }) // per-call options win
```

### Sandbox

```typescript
const fs = new FileSystem({ root: '/srv/uploads' })
fs.pwd() // '/srv/uploads'
fs.readFile('../../etc/passwd') // throws FileSystemError, code 'EACCES'
```

The check is on the resolved path, so a symlink inside `root` can still point outside it.

---

## 📝 Logging

Log level comes from the `logLevel` constructor option, then the `LOG_LEVEL` environment variable, then defaults to `'warn'`. Levels are `debug`, `info`, `warn`, `error` and `off`. Colors are turned off when output isn't a terminal or when [`NO_COLOR`](https://no-color.org) is set.

---

## 📜 License

[MIT](./LICENCE) © Abdellah Allali
