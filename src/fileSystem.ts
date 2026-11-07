/*
	Copyright 2025 Abdellah Allali
*/
import fs from 'node:fs'
import path from 'node:path'
import { Logger, type LogLevel } from './logger'
import { FileSystemError } from './fileSystem.error'
import type {
	CommandOptions,
	CopyOptions,
	DeleteOptions,
	FileSystemOptions,
	MkdirOptions,
	MoveOptions,
	ReadFileOptions,
	WriteFileOptions,
} from './fileSystem.type'

/**
 * Throws a `FileSystemError` for a failure detected by Sysify itself
 * (as opposed to one raised by Node's `fs`).
 */
function fail(
	operation: string,
	code: string,
	message: string,
	filePath?: string,
): never {
	throw new FileSystemError({ operation, code, message, path: filePath })
}

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
export class FileSystem {
	private currentDir: string
	private logger: Logger
	private defaultSilent: boolean
	private defaultForce: boolean

	/**
	 * @param options - Global defaults applied to every command
	 * @param options.silent - Don't log errors (default: `false`)
	 * @param options.force - Don't throw errors (default: `false`)
	 * @param options.logLevel - Logger level (default: `LOG_LEVEL` env, then `'warn'`)
	 */
	constructor(options: FileSystemOptions = {}) {
		this.defaultSilent = options.silent ?? false
		this.defaultForce = options.force ?? false
		this.currentDir = process.cwd()
		this.logger = new Logger('sysify')
		this.logger.setLevel(
			options.logLevel || (process.env.LOG_LEVEL as LogLevel) || 'warn',
		)
		this.logger.debug(`Current directory: ${this.currentDir}`)
	}

	/**
	 * Returns the logger used by this instance (e.g. to change its level).
	 */
	public getLogger(): Logger {
		return this.logger
	}

	/**
	 * Returns the current working directory (absolute path).
	 * Starts at `process.cwd()`; only {@link cd} changes it.
	 */
	public pwd(): string {
		return this.currentDir
	}

	/**
	 * Returns `true` if the path exists (file, directory or other). Never throws.
	 * @param target - Absolute path, or relative to {@link pwd}
	 */
	public exists(target: string): boolean {
		return fs.existsSync(this.resolve(target))
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
	 * @throws {FileSystemError} e.g. `ENOENT` if the parent directory doesn't exist, `EISDIR`
	 */
	public writeFile(
		fileName: string,
		data: string | Buffer,
		options: WriteFileOptions = {},
	): void {
		this.run('writeFile', fileName, options, undefined, () => {
			const filePath = this.resolve(fileName)
			const write = options.append ? fs.appendFileSync : fs.writeFileSync
			write(filePath, data, { encoding: options.encoding })
			this.logger.debug(`File written: ${filePath}`)
		})
	}

	/**
	 * Lists a directory. Directory names end with `/`.
	 * @param targetPath - Directory to list (default: {@link pwd})
	 * @returns Entry names, or `[]` on error with `force: true`
	 * @throws {FileSystemError} `ENOENT` if missing or not a directory, `EACCES`
	 */
	public ls(targetPath?: string, options: CommandOptions = {}): string[] {
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
				const { overwrite } = options
				this.copy(source, destination, { recursive: true, overwrite })
				this.delete(source, { recursive: true })
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

	private resolve(target: string): string {
		return path.resolve(this.currentDir, target)
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

	/**
	 * Runs a command with uniform error handling: wraps Node errors in
	 * `FileSystemError` (keeping their `code`), logs unless `silent`,
	 * throws unless `force` (then returns `fallback`).
	 */
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
			// Node fs errors fail `instanceof Error` across realms (e.g. Jest)
			const err =
				error instanceof FileSystemError
					? error
					: new FileSystemError({
							operation,
							message: (error as Error)?.message ?? String(error),
							code: (error as NodeJS.ErrnoException)?.code,
							path: target,
							originalError: error as Error,
						})
			if (!(options.silent ?? this.defaultSilent)) {
				this.logger.error(err.message)
			}
			if (!(options.force ?? this.defaultForce)) throw err
			return fallback
		}
	}
}
