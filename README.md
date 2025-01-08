# Sysify

**🌟 A Lightweight, TypeScript-Powered File System for Node.js 🌟**

[![📘 TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![🟢 Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![📜 License](https://img.shields.io/badge/License-MIT-blue)](https://opensource.org/licenses/MIT) 
[![📦 npm](https://img.shields.io/npm/v/sysify)](https://www.npmjs.com/package/sysify)
[![🐛 GitHub Issues](https://img.shields.io/github/issues/aallali/sysify)](https://github.com/aallali/sysify/issues)
[![⭐ GitHub Stars](https://img.shields.io/github/stars/aallali/sysify)](https://github.com/aallali/sysify/stargazers)
[![🔗 GitHub Forks](https://img.shields.io/github/forks/aallali/sysify)](https://github.com/aallali/sysify/network/members)
[![npm (tag)](https://img.shields.io/npm/v/typefs/latest)](https://www.npmjs.com/package/typefs)

**`Sysify`** is a minimal yet powerful file system library built with **Node.js** and **TypeScript**. Designed for developers who need a simple, customizable, and extensible way to manage files and directories programmatically, sysify provides an intuitive API for creating, navigating, and persisting file systems. Whether you're building tools, utilities, or experimenting with file system concepts, sysify is the perfect lightweight solution. 🚀

---

## ✨ Features

- **📂 Hierarchical File System**: Create and manage files and directories in a tree-like structure.
- **📝 Metadata Support**: Track file size, permissions, and timestamps.
- **💾 Persistence**: Save and load file systems to/from disk using JSON.
- **✔️ Type-Safe API**: Built with TypeScript for robust and error-free development.
- **🔌 Extensible**: Easily add custom features like permissions, compression, or remote storage.

---

## 📥 Installation

```bash
npm install sysify
```

---

## 🚀 Quick Start

```typescript
import { FileSystem } from 'sysify'
import logger from './logger'

const fs = new FileSystem()
fs.mkdir('documents')
fs.cd('documents')
fs.touch('notes.txt', 'This is a simple note.')
logger.debug(fs.ls()) // Output: ['notes.txt']
fs.save('filesystem.json')
```
