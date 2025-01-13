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

- **📂 Essential Terminal Commands**: Execute familiar file system operations programmatically (“e.g., mkdir, ls, rm”).
- **📚 Typed and Extensible API**: Built with TypeScript for type safety and scalability.
- **🔧 Script-Friendly**: Simplify writing automation scripts and utilities.
- **📝 Metadata Tracking**: Access file and directory metadata like size and permissions.
- **💰 Lightweight and Fast**: Optimized for minimal overhead while retaining robust functionality.

---

## 📥 Installation

Install `sysify` via _`pnpm`_:

```bash
pnpm install sysify
```

---

## 🚀 Quick Start

Here’s a quick example of how to get started with `Sysify`:

```typescript
import { FileSystem } from 'sysify';

const fs = new FileSystem();

// Create a new directory
fs.mkdir('projects');

// Navigate into the directory
fs.cd('projects');

// Create a new file with content
fs.touch('readme.txt', 'Welcome to Sysify!');

// List contents of the current directory
console.log(fs.ls()); // Output: ['readme.txt']

// Delete the file
fs.delete('readme.txt');

// Go back to the root directory
fs.cd('..');

// Delete "projects" folder (a.k.a 'rm -rf projects/')
fs.delete('projects')
```

---

## 🔧 Supported Commands

### File and Directory Management
- **`mkdir(directory: string, options: { silent: boolean } = {})`**: Create a new directory.
- **`cd(directory: string)`**: Change the current working directory.
- **`ls()`**: List contents of the current directory.
- **`touch(file: string, content?: string | Buffer)`**: Create a new file.
- **`delete(target: string, options: { recursive?: boolean, silent: boolean, force?: boolean } = {})`**: Remove a file or directory.

### Metadata
- **`pwd()`**: Get the current working directory.

---

## ⚡ Why Sysify?

- **Ease of Use**: Intuitive API that mirrors terminal commands.
- **Type Safety**: Reduce errors and improve code clarity with TypeScript.
- **Customization**: Easily extend functionality to meet your specific needs.
