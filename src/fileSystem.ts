/*
	Copyright 2025 Abdellah Allali
*/
import fs from 'node:fs'
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

/**
 * Synchronous, shell-like file system API with its own working directory.
 *
 * Every command accepts `silent` (don't log errors) and `force` (don't throw;
 * return a fallback value). Defaults for both can be set in the constructor.
 * Failures throw a {@link FileSystemError} with an errno-style `code`.
 *
 * @example
 * const fs = new FileSystem()
 * fs.mkdir('projects/demo', { recursive: true })
 * fs.cd('projects/demo')
 * fs.writeFile('notes.txt', 'hello')
 * fs.ls() // ['notes.txt']
 */
export class FileSystem extends FileSystemBase {
	/**
	 * Returns `true` if the path exists (file, directory or other). Never throws.
	 * @param target - Absolute path, or relative to {@link pwd}
	 */
	public exists(target: string): boolean {
		return this.tryStat(target) !== undefined
	}

	/**
	 * Returns `true` if the path is a file (symlinks are followed). Never throws.
	 * @param target - Absolute path, or relative to {@link pwd}
	 */
	public isFile(target: string): boolean {
		return this.tryStat(target)?.isFile() ?? false
	}

	/**
	 * Returns `true` if the path is a directory (symlinks are followed). Never throws.
	 * @param target - Absolute path, or relative to {@link pwd}
	 */
	public isDir(target: string): boolean {
		return this.tryStat(target)?.isDirectory() ?? false
	}

	/**
	 * Changes permissions, like `chmod`.
	 * @param target - Absolute path, or relative to {@link pwd}
	 * @param mode - Numeric (`0o755`) or octal string (`'755'`)
	 * @throws {FileSystemError} `ENOENT` if missing, `EPERM` if not the owner
	 */
	public chmod(
		target: string,
		mode: number | string,
		options: CommandOptions = {},
	): void {
		this.run('chmod', target, options, undefined, () => {
			fs.chmodSync(this.resolve(target), mode)
			this.logger.debug(`Mode of ${target} set to ${String(mode)}`)
		})
	}

	/**
	 * Returns metadata (size, mode, timestamps, `isFile()`, ...) for a path.
	 * @param target - Absolute path, or relative to {@link pwd}
	 * @returns The `fs.Stats`, or `undefined` on error with `force: true`
	 * @throws {FileSystemError} `ENOENT` if the path doesn't exist
	 */
	public stat(
		target: string,
		options: CommandOptions = {},
	): fs.Stats | undefined {
		return this.run('stat', target, options, undefined, () =>
			fs.statSync(this.resolve(target)),
		)
	}

	/**
	 * Creates a directory.
	 * @param dirName - Absolute path, or relative to {@link pwd}
	 * @param options.recursive - Create missing parents; no error if it exists (like `mkdir -p`)
	 * @throws {FileSystemError} `EINVAL` if `dirName` is empty, `EEXIST` if it exists (without `recursive`)
	 * @example
	 * fs.mkdir('a/b/c', { recursive: true })
	 */
	public mkdir(dirName: string, options: MkdirOptions = {}): void {
		this.run('mkdir', dirName, options, undefined, () => {
			if (!dirName) fail('mkdir', 'EINVAL', 'missing operand')
			const dirPath = this.resolve(dirName)
			if (!options.recursive && fs.existsSync(dirPath)) {
				fail(
					'mkdir',
					'EEXIST',
					`cannot create directory '${dirName}': Directory exists`,
					dirName,
				)
			}
			fs.mkdirSync(dirPath, { recursive: !!options.recursive })
			this.logger.debug(`Directory created: ${dirPath}`)
		})
	}

	/**
	 * Changes the working directory. If the exact name isn't found, a
	 * case-insensitive match in the parent directory is used.
	 * @param dirName - Absolute path, or relative to {@link pwd}
	 * @throws {FileSystemError} `ENOENT` if not found, `ENOTDIR` if it is not a directory
	 */
	public cd(dirName: string, options: CommandOptions = {}): void {
		this.run('cd', dirName, options, undefined, () => {
			const newDir = this.resolveCaseInsensitivePath(dirName)
			if (!newDir) {
				fail(
					'cd',
					'ENOENT',
					`no such file or directory: ${dirName}`,
					dirName,
				)
			}
			if (!fs.statSync(newDir).isDirectory()) {
				fail('cd', 'ENOTDIR', `not a directory: ${dirName}`, dirName)
			}
			this.currentDir = newDir
			this.logger.debug(`Changed directory to: ${this.currentDir}`)
		})
	}

	/**
	 * Creates a new file. Unlike shell `touch`, it fails if the file exists;
	 * use {@link writeFile} to overwrite or append.
	 * @param fileName - Absolute path, or relative to {@link pwd}
	 * @param content - Initial content (UTF-8 string or `Buffer`)
	 * @throws {FileSystemError} `EEXIST` if the file already exists
	 */
	public touch(
		fileName: string,
		content: string | Buffer = '',
		options: CommandOptions = {},
	): void {
		this.run('touch', fileName, options, undefined, () => {
			const filePath = this.resolve(fileName)
			if (fs.existsSync(filePath)) {
				fail(
					'touch',
					'EEXIST',
					`cannot create file '${fileName}': File exists`,
					fileName,
				)
			}
			fs.writeFileSync(filePath, content)
			this.logger.info(`File created: ${filePath}`)
		})
	}

	/**
	 * Writes a file, creating it or replacing its content.
	 * @param fileName - Absolute path, or relative to {@link pwd}
	 * @param data - String or `Buffer`
	 * @param options.append - Append instead of replacing
	 * @param options.encoding - Encoding for string data (default: `'utf8'`)
	 * @param options.atomic - Write a temp file then rename it over the target
	 * @throws {FileSystemError} e.g. `ENOENT` if the parent directory doesn't exist, `EISDIR`, `EINVAL` for `append` + `atomic`
	 */
	public writeFile(
		fileName: string,
		data: string | Buffer,
		options: WriteFileOptions = {},
	): void {
		this.run('writeFile', fileName, options, undefined, () =>
			this.write('writeFile', fileName, data, options),
		)
	}

	/**
	 * Reads and parses a JSON file.
	 * @param fileName - Absolute path, or relative to {@link pwd}
	 * @returns The parsed value, or `undefined` on error with `force: true`
	 * @throws {FileSystemError} `ENOENT`, `EISDIR`, `EJSON` if the content is not valid JSON
	 * @example
	 * const pkg = fs.readJson<{ version: string }>('package.json')
	 */
	public readJson<T = unknown>(
		fileName: string,
		options: CommandOptions = {},
	): T | undefined {
		return this.run('readJson', fileName, options, undefined, () => {
			const text = this.readFile(fileName, {
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

	/**
	 * Serializes a value as JSON (with a trailing newline) and writes it.
	 * @param fileName - Absolute path, or relative to {@link pwd}
	 * @param options.spaces - Indentation (default: `2`)
	 * @param options.atomic - Write a temp file then rename it over the target
	 * @throws {FileSystemError} same as {@link writeFile}
	 */
	public writeJson(
		fileName: string,
		data: unknown,
		options: WriteJsonOptions = {},
	): void {
		this.run('writeJson', fileName, options, undefined, () => {
			const json = JSON.stringify(data, null, options.spaces ?? 2) + '\n'
			this.write('writeJson', fileName, json, { atomic: options.atomic })
		})
	}

	/**
	 * Lists a directory. Directory names end with `/`.
	 * @param targetPath - Directory to list (default: {@link pwd})
	 * @param options.recursive - Include subdirectories (paths relative to `targetPath`)
	 * @returns Entry names, or `[]` on error with `force: true`
	 * @throws {FileSystemError} `ENOENT` if missing or not a directory, `EACCES`
	 */
	public ls(targetPath?: string, options: LsOptions = {}): string[] {
		return this.run('ls', targetPath, options, [], () => {
			const dir = targetPath ? this.resolve(targetPath) : this.currentDir
			if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
				fail(
					'ls',
					'ENOENT',
					`Path '${dir}' does not exist or is not a directory.`,
					targetPath,
				)
			}
			if (options.recursive) {
				// ponytail: one lstat per entry; withFileTypes+recursive is buggy on early Node 20
				return fs
					.readdirSync(dir, { recursive: true, encoding: 'utf8' })
					.map((rel) =>
						fs.lstatSync(path.join(dir, rel)).isDirectory()
							? `${rel}/`
							: rel,
					)
			}
			return fs
				.readdirSync(dir, { withFileTypes: true })
				.map((e) => (e.isDirectory() ? `${e.name}/` : e.name))
		})
	}

	/**
	 * Deletes a file, or a directory with `recursive: true`.
	 * @param target - Absolute path, or relative to {@link pwd}
	 * @param options.recursive - Required for directories (like `rm -r`)
	 * @throws {FileSystemError} `ENOENT` if missing, `EISDIR` for a directory without `recursive`
	 */
	public delete(target: string, options: DeleteOptions = {}): void {
		this.run('delete', target, options, undefined, () => {
			const targetPath = this.resolve(target)
			if (!fs.existsSync(targetPath)) {
				fail(
					'delete',
					'ENOENT',
					`cannot delete '${target}': No such file or directory`,
					target,
				)
			}
			if (fs.lstatSync(targetPath).isDirectory() && !options.recursive) {
				fail(
					'delete',
					'EISDIR',
					`'${target}' is a directory (use recursive option to delete)`,
					target,
				)
			}
			fs.rmSync(targetPath, { recursive: !!options.recursive })
			this.logger.info(`Deleted: ${targetPath}`)
		})
	}

	/**
	 * Copies a file, or a directory with `recursive: true`.
	 * @param source - Absolute path, or relative to {@link pwd}
	 * @param destination - Absolute path, or relative to {@link pwd}
	 * @param options.recursive - Required for directories (like `cp -r`)
	 * @param options.overwrite - Replace the destination if it exists
	 * @throws {FileSystemError} `ENOENT`, `EEXIST` (without `overwrite`), `EISDIR` (directory without `recursive`), `ENOTSUP` (sockets, devices...)
	 */
	public copy(
		source: string,
		destination: string,
		options: CopyOptions = {},
	): void {
		this.run('copy', source, options, undefined, () => {
			const { sourcePath, destPath } = this.checkTransfer(
				'copy',
				source,
				destination,
				options.overwrite,
			)
			const stats = fs.statSync(sourcePath)
			if (stats.isFile()) {
				fs.copyFileSync(
					sourcePath,
					destPath,
					options.overwrite ? 0 : fs.constants.COPYFILE_EXCL,
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
				fs.cpSync(sourcePath, destPath, {
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
	 * Moves a file or directory. Falls back to copy + delete across devices.
	 * @param source - Absolute path, or relative to {@link pwd}
	 * @param destination - Absolute path, or relative to {@link pwd}
	 * @param options.overwrite - Replace the destination if it exists
	 * @throws {FileSystemError} `ENOENT` if the source is missing, `EEXIST` (without `overwrite`)
	 */
	public move(
		source: string,
		destination: string,
		options: MoveOptions = {},
	): void {
		this.run('move', source, options, undefined, () => {
			const { sourcePath, destPath } = this.checkTransfer(
				'move',
				source,
				destination,
				options.overwrite,
			)
			try {
				fs.renameSync(sourcePath, destPath)
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code !== 'EXDEV')
					throw error
				// Different devices: rename can't work, copy then delete
				// Never swallow a copy failure here, or the delete loses the source
				const inner = { silent: true, force: false }
				const { overwrite } = options
				this.copy(source, destination, {
					...inner,
					recursive: true,
					overwrite,
				})
				this.delete(source, { ...inner, recursive: true })
			}
			this.logger.debug(`Moved ${sourcePath} to ${destPath}`)
		})
	}

	/**
	 * Renames a file or directory. Never replaces an existing destination.
	 * @param oldPath - Absolute path, or relative to {@link pwd}
	 * @param newPath - Absolute path, or relative to {@link pwd}
	 * @throws {FileSystemError} `ENOENT` if missing (or destination folder missing), `EEXIST` if the new path exists
	 */
	public rename(
		oldPath: string,
		newPath: string,
		options: CommandOptions = {},
	): void {
		this.run('rename', oldPath, options, undefined, () => {
			const from = this.resolve(oldPath)
			const to = this.resolve(newPath)
			if (!fs.existsSync(from)) {
				fail(
					'rename',
					'ENOENT',
					`cannot rename '${oldPath}': No such file or directory`,
					oldPath,
				)
			}
			if (fs.existsSync(to)) {
				fail(
					'rename',
					'EEXIST',
					`cannot rename to '${newPath}': File exists`,
					newPath,
				)
			}
			fs.renameSync(from, to)
			this.logger.debug(`Renamed ${from} to ${to}`)
		})
	}

	/**
	 * Reads a file. Returns a string when `encoding` is set, otherwise a `Buffer`.
	 * On error with `force: true`, returns an empty string / `Buffer`.
	 * @param filePath - Absolute path, or relative to {@link pwd}
	 * @throws {FileSystemError} `ENOENT` if missing, `EISDIR` for a directory, `EACCES`
	 * @example
	 * const text = fs.readFile('notes.txt', { encoding: 'utf8' }) // string
	 * const bytes = fs.readFile('image.png') // Buffer
	 */
	public readFile(
		filePath: string,
		options: ReadFileOptions & { encoding: BufferEncoding },
	): string
	public readFile(
		filePath: string,
		options?: ReadFileOptions & { encoding?: undefined },
	): Buffer
	public readFile(
		filePath: string,
		options?: ReadFileOptions,
	): string | Buffer
	public readFile(
		filePath: string,
		options: ReadFileOptions = {},
	): string | Buffer {
		const fallback = options.encoding ? '' : Buffer.alloc(0)
		return this.run('readFile', filePath, options, fallback, () => {
			const resolved = this.resolve(filePath)
			if (!fs.existsSync(resolved)) {
				fail(
					'readFile',
					'ENOENT',
					`cannot read '${filePath}': No such file or directory`,
					filePath,
				)
			}
			if (fs.statSync(resolved).isDirectory()) {
				fail(
					'readFile',
					'EISDIR',
					`cannot read '${filePath}': Is a directory`,
					filePath,
				)
			}
			return fs.readFileSync(resolved, {
				encoding: options.encoding,
				flag: options.flag,
			})
		})
	}

	/** `stat` that returns `undefined` instead of throwing (missing, outside root...). */
	private tryStat(target: string): fs.Stats | undefined {
		try {
			return fs.statSync(this.resolve(target), { throwIfNoEntry: false })
		} catch {
			return undefined
		}
	}

	/** Shared body of `writeFile` / `writeJson`; must run inside `run`. */
	private write(
		operation: string,
		fileName: string,
		data: string | Buffer,
		options: Omit<WriteFileOptions, keyof CommandOptions>,
	): void {
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
			fs.appendFileSync(filePath, data, { encoding })
		} else if (options.atomic) {
			// ponytail: the temp file gets default permissions, not the old file's mode
			const tmp = `${filePath}.${randomUUID()}.tmp`
			try {
				fs.writeFileSync(tmp, data, { encoding })
				fs.renameSync(tmp, filePath)
			} catch (error) {
				fs.rmSync(tmp, { force: true })
				throw error
			}
		} else {
			fs.writeFileSync(filePath, data, { encoding })
		}
		this.logger.debug(`File written: ${filePath}`)
	}

	/** Shared source/destination checks for `copy` and `move`. */
	private checkTransfer(
		operation: string,
		source: string,
		destination: string,
		overwrite = false,
	): { sourcePath: string; destPath: string } {
		const sourcePath = this.resolve(source)
		const destPath = this.resolve(destination)
		if (!fs.existsSync(sourcePath)) {
			fail(
				operation,
				'ENOENT',
				`cannot ${operation} '${source}': No such file or directory`,
				source,
			)
		}
		if (!overwrite && fs.existsSync(destPath)) {
			fail(
				operation,
				'EEXIST',
				`'${destination}' already exists`,
				destination,
			)
		}
		return { sourcePath, destPath }
	}

	private resolveCaseInsensitivePath(dirName: string): string | null {
		const resolvedPath = this.resolve(dirName)
		if (fs.existsSync(resolvedPath)) return resolvedPath

		const parentDir = path.dirname(resolvedPath)
		if (!fs.existsSync(parentDir)) return null

		const target = path.basename(resolvedPath).toLowerCase()
		const match = fs
			.readdirSync(parentDir)
			.find((entry) => entry.toLowerCase() === target)
		return match ? path.join(parentDir, match) : null
	}

	/** Runs `fn` with the shared error handling (see `handle`). */
	private run<T>(
		operation: string,
		target: string | undefined,
		options: CommandOptions,
		fallback: T,
		fn: () => T,
	): T {
		try {
			return fn()
		} catch (error) {
			return this.handle(operation, target, options, fallback, error)
		}
	}
}
