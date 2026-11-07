/*
	Copyright 2025 Abdellah Allali
*/
import type { Stats } from 'node:fs'
import fs from 'node:fs/promises'
import { constants } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { FileSystemBase, fail } from './base'
import type {
	CommandOptions,
	CopyOptions,
	DeleteOptions,
	LsOptions,
	MkdirOptions,
	MoveOptions,
	ReadFileOptions,
	WriteFileOptions,
	WriteJsonOptions,
} from './fileSystem.type'

export { FileSystemError } from './fileSystem.error'
export type { LogLevel } from './logger'
export type * from './fileSystem.type'

/**
 * Promise-based twin of the sync `FileSystem` (import from `sysify/promises`).
 * Same commands, options, error codes and messages; every command except
 * `pwd` and `getLogger` returns a `Promise`.
 *
 * The working directory is per instance: don't run `cd` concurrently with
 * other commands on the same instance.
 *
 * @example
 * import { FileSystem } from 'sysify/promises'
 * const fs = new FileSystem()
 * await fs.mkdir('projects/demo', { recursive: true })
 * await fs.cd('projects/demo')
 * await fs.writeFile('notes.txt', 'hello')
 * await fs.ls() // ['notes.txt']
 */
export class FileSystem extends FileSystemBase {
	/** Resolves to `true` if the path exists. Never rejects. */
	public async exists(target: string): Promise<boolean> {
		return (await this.tryStat(target)) !== undefined
	}

	/** Resolves to `true` if the path is a file (symlinks followed). Never rejects. */
	public async isFile(target: string): Promise<boolean> {
		return (await this.tryStat(target))?.isFile() ?? false
	}

	/** Resolves to `true` if the path is a directory (symlinks followed). Never rejects. */
	public async isDir(target: string): Promise<boolean> {
		return (await this.tryStat(target))?.isDirectory() ?? false
	}

	/**
	 * Metadata for a path; `undefined` on error with `force: true`.
	 * @throws {FileSystemError} `ENOENT`
	 */
	public stat(
		target: string,
		options: CommandOptions = {},
	): Promise<Stats | undefined> {
		return this.run('stat', target, options, undefined, () =>
			fs.stat(this.resolve(target)),
		)
	}

	/**
	 * Changes permissions, like `chmod`.
	 * @throws {FileSystemError} `ENOENT`, `EPERM`
	 */
	public chmod(
		target: string,
		mode: number | string,
		options: CommandOptions = {},
	): Promise<void> {
		return this.run('chmod', target, options, undefined, () =>
			fs.chmod(this.resolve(target), mode),
		)
	}

	/**
	 * Creates a directory (`recursive` = `mkdir -p`).
	 * @throws {FileSystemError} `EINVAL` if empty, `EEXIST` without `recursive`
	 */
	public mkdir(dirName: string, options: MkdirOptions = {}): Promise<void> {
		return this.run('mkdir', dirName, options, undefined, async () => {
			if (!dirName) fail('mkdir', 'EINVAL', 'missing operand')
			const dirPath = this.resolve(dirName)
			try {
				await fs.mkdir(dirPath, { recursive: !!options.recursive })
			} catch (error) {
				const { code } = error as NodeJS.ErrnoException
				if (code !== 'EEXIST' || options.recursive) throw error
				fail(
					'mkdir',
					'EEXIST',
					`cannot create directory '${dirName}': Directory exists`,
					dirName,
				)
			}
			this.logger.debug(`Directory created: ${dirPath}`)
		})
	}

	/**
	 * Changes the working directory (case-insensitive fallback in the parent).
	 * @throws {FileSystemError} `ENOENT`, `ENOTDIR`
	 */
	public cd(dirName: string, options: CommandOptions = {}): Promise<void> {
		return this.run('cd', dirName, options, undefined, async () => {
			const newDir = await this.resolveCaseInsensitivePath(dirName)
			if (!newDir) {
				fail(
					'cd',
					'ENOENT',
					`no such file or directory: ${dirName}`,
					dirName,
				)
			}
			if (!(await fs.stat(newDir)).isDirectory()) {
				fail('cd', 'ENOTDIR', `not a directory: ${dirName}`, dirName)
			}
			this.currentDir = newDir
			this.logger.debug(`Changed directory to: ${this.currentDir}`)
		})
	}

	/**
	 * Creates a new file; fails if it exists.
	 * @throws {FileSystemError} `EEXIST`
	 */
	public touch(
		fileName: string,
		content: string | Buffer = '',
		options: CommandOptions = {},
	): Promise<void> {
		return this.run('touch', fileName, options, undefined, async () => {
			const filePath = this.resolve(fileName)
			try {
				await fs.writeFile(filePath, content, { flag: 'wx' })
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code !== 'EEXIST')
					throw error
				fail(
					'touch',
					'EEXIST',
					`cannot create file '${fileName}': File exists`,
					fileName,
				)
			}
			this.logger.info(`File created: ${filePath}`)
		})
	}

	/**
	 * Writes a file (`append`, `encoding`, `atomic`).
	 * @throws {FileSystemError} `ENOENT`, `EISDIR`, `EINVAL` for `append` + `atomic`
	 */
	public writeFile(
		fileName: string,
		data: string | Buffer,
		options: WriteFileOptions = {},
	): Promise<void> {
		return this.run('writeFile', fileName, options, undefined, () =>
			this.write('writeFile', fileName, data, options),
		)
	}

	/**
	 * Reads and parses a JSON file; `undefined` on error with `force: true`.
	 * @throws {FileSystemError} `ENOENT`, `EISDIR`, `EJSON`
	 */
	public readJson<T = unknown>(
		fileName: string,
		options: CommandOptions = {},
	): Promise<T | undefined> {
		return this.run('readJson', fileName, options, undefined, async () => {
			const text = await this.readFile(fileName, {
				encoding: 'utf8',
				silent: true,
				force: false,
			})
			try {
				return JSON.parse(text) as T
			} catch (error) {
				fail(
					'readJson',
					'EJSON',
					`invalid JSON in '${fileName}': ${(error as Error).message}`,
					fileName,
				)
			}
		})
	}

	/** Writes a value as JSON with a trailing newline (`spaces`, `atomic`). */
	public writeJson(
		fileName: string,
		data: unknown,
		options: WriteJsonOptions = {},
	): Promise<void> {
		return this.run('writeJson', fileName, options, undefined, () => {
			const json = JSON.stringify(data, null, options.spaces ?? 2) + '\n'
			return this.write('writeJson', fileName, json, {
				atomic: options.atomic,
			})
		})
	}

	/**
	 * Lists a directory; directory names end with `/`. `[]` on error with `force: true`.
	 * @throws {FileSystemError} `ENOENT` if missing or not a directory
	 */
	public ls(targetPath?: string, options: LsOptions = {}): Promise<string[]> {
		return this.run('ls', targetPath, options, [], async () => {
			const dir = targetPath ? this.resolve(targetPath) : this.currentDir
			const stats = await fs.stat(dir).catch(() => undefined)
			if (!stats?.isDirectory()) {
				fail(
					'ls',
					'ENOENT',
					`Path '${dir}' does not exist or is not a directory.`,
					targetPath,
				)
			}
			if (options.recursive) {
				const entries = await fs.readdir(dir, {
					recursive: true,
					encoding: 'utf8',
				})
				return Promise.all(
					entries.map(async (rel) =>
						(await fs.lstat(path.join(dir, rel))).isDirectory()
							? `${rel}/`
							: rel,
					),
				)
			}
			const entries = await fs.readdir(dir, { withFileTypes: true })
			return entries.map((e) => (e.isDirectory() ? `${e.name}/` : e.name))
		})
	}

	/**
	 * Deletes a file, or a directory with `recursive`.
	 * @throws {FileSystemError} `ENOENT`, `EISDIR`
	 */
	public delete(target: string, options: DeleteOptions = {}): Promise<void> {
		return this.run('delete', target, options, undefined, async () => {
			const targetPath = this.resolve(target)
			const stats = await fs.lstat(targetPath).catch(() => undefined)
			if (!stats) {
				fail(
					'delete',
					'ENOENT',
					`cannot delete '${target}': No such file or directory`,
					target,
				)
			}
			if (stats.isDirectory() && !options.recursive) {
				fail(
					'delete',
					'EISDIR',
					`'${target}' is a directory (use recursive option to delete)`,
					target,
				)
			}
			await fs.rm(targetPath, { recursive: !!options.recursive })
			this.logger.info(`Deleted: ${targetPath}`)
		})
	}

	/**
	 * Copies a file, or a directory with `recursive`.
	 * @throws {FileSystemError} `ENOENT`, `EEXIST`, `EISDIR`, `ENOTSUP`
	 */
	public copy(
		source: string,
		destination: string,
		options: CopyOptions = {},
	): Promise<void> {
		return this.run('copy', source, options, undefined, async () => {
			const { sourcePath, destPath } = await this.checkTransfer(
				'copy',
				source,
				destination,
				options.overwrite,
			)
			const stats = await fs.stat(sourcePath)
			if (stats.isFile()) {
				await fs.copyFile(
					sourcePath,
					destPath,
					options.overwrite ? 0 : constants.COPYFILE_EXCL,
				)
			} else if (stats.isDirectory()) {
				if (!options.recursive) {
					fail(
						'copy',
						'EISDIR',
						`omitting directory '${source}' (use recursive option to copy)`,
						source,
					)
				}
				await fs.cp(sourcePath, destPath, {
					recursive: true,
					force: !!options.overwrite,
				})
			} else {
				fail(
					'copy',
					'ENOTSUP',
					`unsupported file type for '${source}'`,
					source,
				)
			}
			this.logger.debug(`Copied ${sourcePath} to ${destPath}`)
		})
	}

	/**
	 * Moves a file or directory (copy + delete across devices).
	 * @throws {FileSystemError} `ENOENT`, `EEXIST`
	 */
	public move(
		source: string,
		destination: string,
		options: MoveOptions = {},
	): Promise<void> {
		return this.run('move', source, options, undefined, async () => {
			const { sourcePath, destPath } = await this.checkTransfer(
				'move',
				source,
				destination,
				options.overwrite,
			)
			try {
				await fs.rename(sourcePath, destPath)
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code !== 'EXDEV')
					throw error
				// Never swallow a copy failure here, or the delete loses the source
				const inner = { silent: true, force: false }
				const { overwrite } = options
				await this.copy(source, destination, {
					...inner,
					recursive: true,
					overwrite,
				})
				await this.delete(source, { ...inner, recursive: true })
			}
			this.logger.debug(`Moved ${sourcePath} to ${destPath}`)
		})
	}

	/**
	 * Renames; never replaces an existing destination.
	 * @throws {FileSystemError} `ENOENT`, `EEXIST`
	 */
	public rename(
		oldPath: string,
		newPath: string,
		options: CommandOptions = {},
	): Promise<void> {
		return this.run('rename', oldPath, options, undefined, async () => {
			const from = this.resolve(oldPath)
			const to = this.resolve(newPath)
			if (!(await this.tryStat(oldPath, true))) {
				fail(
					'rename',
					'ENOENT',
					`cannot rename '${oldPath}': No such file or directory`,
					oldPath,
				)
			}
			if (await this.tryStat(newPath, true)) {
				fail(
					'rename',
					'EEXIST',
					`cannot rename to '${newPath}': File exists`,
					newPath,
				)
			}
			await fs.rename(from, to)
			this.logger.debug(`Renamed ${from} to ${to}`)
		})
	}

	/**
	 * Reads a file: `string` with `encoding`, otherwise `Buffer`.
	 * On error with `force: true`, an empty string / `Buffer`.
	 * @throws {FileSystemError} `ENOENT`, `EISDIR`, `EACCES`
	 */
	public readFile(
		filePath: string,
		options: ReadFileOptions & { encoding: BufferEncoding },
	): Promise<string>
	public readFile(
		filePath: string,
		options?: ReadFileOptions & { encoding?: undefined },
	): Promise<Buffer>
	public readFile(
		filePath: string,
		options?: ReadFileOptions,
	): Promise<string | Buffer>
	public readFile(
		filePath: string,
		options: ReadFileOptions = {},
	): Promise<string | Buffer> {
		const fallback = options.encoding ? '' : Buffer.alloc(0)
		return this.run('readFile', filePath, options, fallback, async () => {
			const resolved = this.resolve(filePath)
			const stats = await fs.stat(resolved).catch(() => undefined)
			if (!stats) {
				fail(
					'readFile',
					'ENOENT',
					`cannot read '${filePath}': No such file or directory`,
					filePath,
				)
			}
			if (stats.isDirectory()) {
				fail(
					'readFile',
					'EISDIR',
					`cannot read '${filePath}': Is a directory`,
					filePath,
				)
			}
			return fs.readFile(resolved, {
				encoding: options.encoding,
				flag: options.flag,
			})
		})
	}

	/** `stat` (or `lstat`) that resolves `undefined` instead of rejecting. */
	private async tryStat(
		target: string,
		lstat = false,
	): Promise<Stats | undefined> {
		try {
			const p = this.resolve(target)
			return await (lstat ? fs.lstat(p) : fs.stat(p))
		} catch {
			return undefined
		}
	}

	/** Shared body of `writeFile` / `writeJson`; must run inside `run`. */
	private async write(
		operation: string,
		fileName: string,
		data: string | Buffer,
		options: Omit<WriteFileOptions, keyof CommandOptions>,
	): Promise<void> {
		const filePath = this.resolve(fileName)
		const { encoding } = options
		if (options.append && options.atomic) {
			fail(
				operation,
				'EINVAL',
				'append and atomic cannot be combined',
				fileName,
			)
		}
		if (options.append) {
			await fs.appendFile(filePath, data, { encoding })
		} else if (options.atomic) {
			// ponytail: the temp file gets default permissions, not the old file's mode
			const tmp = `${filePath}.${randomUUID()}.tmp`
			try {
				await fs.writeFile(tmp, data, { encoding })
				await fs.rename(tmp, filePath)
			} catch (error) {
				await fs.rm(tmp, { force: true })
				throw error
			}
		} else {
			await fs.writeFile(filePath, data, { encoding })
		}
		this.logger.debug(`File written: ${filePath}`)
	}

	/** Shared source/destination checks for `copy` and `move`. */
	private async checkTransfer(
		operation: string,
		source: string,
		destination: string,
		overwrite = false,
	): Promise<{ sourcePath: string; destPath: string }> {
		const sourcePath = this.resolve(source)
		const destPath = this.resolve(destination)
		if (!(await this.tryStat(source))) {
			fail(
				operation,
				'ENOENT',
				`cannot ${operation} '${source}': No such file or directory`,
				source,
			)
		}
		if (!overwrite && (await this.tryStat(destination))) {
			fail(
				operation,
				'EEXIST',
				`'${destination}' already exists`,
				destination,
			)
		}
		return { sourcePath, destPath }
	}

	private async resolveCaseInsensitivePath(
		dirName: string,
	): Promise<string | null> {
		const resolvedPath = this.resolve(dirName)
		if (await this.tryStat(resolvedPath)) return resolvedPath

		const parentDir = path.dirname(resolvedPath)
		const entries = await fs.readdir(parentDir).catch(() => null)
		if (!entries) return null

		const target = path.basename(resolvedPath).toLowerCase()
		const match = entries.find((entry) => entry.toLowerCase() === target)
		return match ? path.join(parentDir, match) : null
	}

	/** Runs `fn` with the shared error handling (see `handle`). */
	private async run<T>(
		operation: string,
		target: string | undefined,
		options: CommandOptions,
		fallback: T,
		fn: () => T | Promise<T>,
	): Promise<T> {
		try {
			return await fn()
		} catch (error) {
			return this.handle(operation, target, options, fallback, error)
		}
	}
}
