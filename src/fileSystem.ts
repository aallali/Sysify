/*
	Copyright 2025 Abdellah Allali
*/
import fs from 'node:fs'
import path from 'node:path'
import { Logger, type LogLevel } from './logger'
import { FileSystemError } from './fileSystem.error'
import type {
	DeleteOptions,
	MkdirOptions,
	CopyOptions,
	MoveOptions,
	ReadFileOptions,
} from './fileSystem.type'

export class FileSystem {
	private currentDir: string
	private logger: Logger
	private defaultSilent: boolean
	private defaultForce: boolean

	constructor(options?: {
		silent?: boolean
		force?: boolean
		logLevel?: LogLevel
	}) {
		const logLevel =
			options?.logLevel || (process.env.LOG_LEVEL as LogLevel) || 'warn'
		this.defaultSilent = options?.silent || false
		this.defaultForce = options?.force || false
		this.currentDir = process.cwd()
		this.logger = new Logger('sysify')
		this.logger.setLevel(logLevel)
		this.logger.debug(`Current directory: ${this.pwd()}`)
	}

	// Helper method to merge global & method options
	private getErrorOptions(methodOptions?: {
		silent?: boolean
		force?: boolean
	}): {
		silent: boolean
		force: boolean
	} {
		return {
			silent: methodOptions?.silent ?? this.defaultSilent,
			force: methodOptions?.force ?? this.defaultForce,
		}
	}

	/**
	 * Returns the logger instance
	 * @returns {Logger} The logger instance for this FileSystem
	 * @example
	 * const fs = new FileSystem();
	 * const logger = fs.getLogger();
	 * logger.info('Custom message');
	 */
	public getLogger(): Logger {
		return this.logger
	}

	/**
	 * Returns the current working directory path
	 * @returns {string} The absolute path of the current directory
	 * @example
	 * const fs = new FileSystem();
	 * console.log(fs.pwd()); // e.g. '/home/user/projects'
	 */
	public pwd(): string {
		return this.currentDir
	}

	/**
	 * Creates a new directory
	 * @param {string} dirName - Path of the directory to create (absolute or relative)
	 * @param {MkdirOptions} [options={}] - Directory creation options
	 * @param {boolean} [options.silent=false] - When true, suppresses errors if directory exists
	 * @throws {FileSystemError} If directory already exists or cannot be created
	 * @example
	 * // Create a directory
	 * fs.mkdir('new-directory');
	 *
	 * // Create silently (no error if exists)
	 * fs.mkdir('existing-directory', { silent: true });
	 */
	public mkdir(dirName: string, options: MkdirOptions = {}): void {
		const { silent, force } = this.getErrorOptions(options)

		if (!dirName) {
			return this.handleError<void>({
				operation: 'mkdir',
				message: 'missing operand',
				silent,
				force,
			})
		}

		const newDirPath = path.join(this.currentDir, dirName)

		try {
			if (fs.existsSync(newDirPath)) {
				return this.handleError({
					operation: 'mkdir',
					message: `cannot create directory '${dirName}': Directory exists`,
					path: dirName,
					silent,
					force,
				})
			}

			fs.mkdirSync(newDirPath)
			this.logger.debug(`Directory created: ${newDirPath}`)
		} catch (error) {
			return this.handleError({
				operation: 'mkdir',
				message: `failed to create directory '${dirName}'`,
				path: dirName,
				originalError: error as Error,
				silent,
				force,
			})
		}
	}

	/**
	 * Changes the current working directory
	 * @param {string} dirName - Directory path to navigate to (absolute or relative)
	 * @param {object} [options={}] - Options for changing directory
	 * @param {boolean} [options.silent=false] - When true, suppresses logs
	 * @param {boolean} [options.force=false] - When true, ignores errors
	 * @throws {FileSystemError} If directory doesn't exist or is not a directory
	 */
	public cd(
		dirName: string,
		options: { silent?: boolean; force?: boolean } = {},
	): void {
		const { silent, force } = this.getErrorOptions(options)

		try {
			const newDir = this.resolveCaseInsensitivePath(dirName)

			if (!newDir) {
				return this.handleError({
					operation: 'cd',
					message: `no such file or directory: ${dirName}`,
					path: dirName,
					silent,
					force,
				})
			}

			if (!fs.statSync(newDir).isDirectory()) {
				return this.handleError({
					operation: 'cd',
					message: `not a directory: ${dirName}`,
					path: dirName,
					silent,
					force,
				})
			}

			this.currentDir = newDir
			this.logger.debug(`Changed directory to: ${this.currentDir}`)
		} catch (error) {
			return this.handleError({
				operation: 'cd',
				message: `no such file or directory: ${dirName}`,
				path: dirName,
				originalError: error as Error,
				silent,
				force,
			})
		}
	}

	private resolveCaseInsensitivePath(dirName: string): string | null {
		const resolvedPath = path.resolve(this.currentDir, dirName)

		// If the path exists, return it directly
		if (fs.existsSync(resolvedPath)) {
			return resolvedPath
		}

		// Handle case-insensitive resolution
		const parentDir = path.dirname(resolvedPath)
		const targetName = path.basename(resolvedPath)

		if (!fs.existsSync(parentDir)) {
			return null
		}

		const dirContents = fs.readdirSync(parentDir)
		const match = dirContents.find(
			(entry) => entry.toLowerCase() === targetName.toLowerCase(),
		)

		return match ? path.join(parentDir, match) : null
	}

	/**
	 * Creates an empty file or writes content to a new file
	 * @param {string} fileName - Name of the file to create
	 * @param {string|Buffer} [content=''] - Optional content to write to the file
	 * @param {object} [options={}] - Options for creating files
	 * @param {boolean} [options.silent=false] - When true, suppresses logs
	 * @param {boolean} [options.force=false] - When true, ignores errors
	 * @throws {FileSystemError} If file already exists
	 */
	public touch(
		fileName: string,
		content: string | Buffer = '',
		options: { silent?: boolean; force?: boolean } = {},
	): void {
		const { silent, force } = this.getErrorOptions(options)
		const newFilePath = path.join(this.currentDir, fileName)

		try {
			if (fs.existsSync(newFilePath)) {
				return this.handleError({
					operation: 'touch',
					message: `cannot create file '${fileName}': File exists`,
					path: fileName,
					silent,
					force,
				})
			}

			const bufferContent = Buffer.isBuffer(content)
				? content
				: Buffer.from(content, 'utf-8')

			fs.writeFileSync(newFilePath, bufferContent)
			this.logger.info(`File created: ${newFilePath}`)
		} catch (error) {
			return this.handleError({
				operation: 'touch',
				message: `failed to create file '${fileName}'`,
				path: fileName,
				originalError: error as Error,
				silent,
				force,
			})
		}
	}

	/**
	 * Lists files and directories in the specified path
	 * @param {string} [targetPath] - Path to list contents of (defaults to current directory)
	 * @returns {string[]} Array of file and directory names (directories end with '/')
	 * @throws {FileSystemError} If path doesn't exist or is not a directory
	 */
	public ls(targetPath?: string): string[] {
		const { silent, force } = this.getErrorOptions()
		const dirToRead = targetPath
			? path.resolve(this.currentDir, targetPath)
			: this.currentDir

		try {
			if (
				!fs.existsSync(dirToRead) ||
				!fs.statSync(dirToRead).isDirectory()
			) {
				return this.handleError<string[]>({
					operation: 'ls',
					message: `Path '${dirToRead}' does not exist or is not a directory.`,
					path: targetPath,
					silent,
					force,
					returnValue: [], // Return empty array when force=true
				})
			}

			const entries = fs.readdirSync(dirToRead)
			const listing = entries.map((entry) => {
				const fullPath = path.join(dirToRead, entry)
				return fs.statSync(fullPath).isDirectory() ? `${entry}/` : entry
			})

			return listing
		} catch (error) {
			return this.handleError<string[]>({
				operation: 'ls',
				message: `Failed to list files in: ${dirToRead}`,
				path: targetPath,
				originalError: error as Error,
				silent,
				force,
				returnValue: [], // Return empty array when force=true
			})
		}
	}

	/**
	 * Deletes files or directories
	 * @param {string} target - Path to file or directory to delete
	 * @param {DeleteOptions} [options={}] - Delete operation options
	 * @param {boolean} [options.recursive=false] - When true, recursively deletes directories and their contents
	 * @param {boolean} [options.force=false] - When true, ignores non-existent files and continues execution
	 * @param {boolean} [options.silent=false] - When true, suppresses log messages
	 * @throws {FileSystemError} If target doesn't exist or is a directory without recursive option
	 */
	public delete(target: string, options: DeleteOptions = {}): void {
		const { recursive = false } = options
		const { silent, force } = this.getErrorOptions(options)
		const targetPath = path.resolve(this.currentDir, target)

		try {
			if (!fs.existsSync(targetPath)) {
				return this.handleError({
					operation: 'delete',
					message: `cannot delete '${target}': No such file or directory`,
					path: target,
					silent,
					force,
				})
			}

			const stats = fs.statSync(targetPath)

			if (stats.isDirectory()) {
				if (!recursive) {
					return this.handleError({
						operation: 'delete',
						message: `'${target}' is a directory (use recursive option to delete)`,
						path: target,
						silent,
						force,
					})
				}

				for (const entry of fs.readdirSync(targetPath)) {
					this.delete(path.join(target, entry), {
						recursive,
						force,
						silent,
					})
				}

				fs.rmdirSync(targetPath)
			} else {
				fs.unlinkSync(targetPath)
			}

			if (!silent) {
				this.logger.info(`Deleted: ${targetPath}`)
			}
		} catch (error) {
			return this.handleError({
				operation: 'delete',
				message: `error when deleting ${target}`,
				path: target,
				originalError: error as Error,
				silent,
				force,
			})
		}
	}

	/**
	 * Copies a file or directory from source to destination
	 * @param {string} source - Path to the source file or directory
	 * @param {string} destination - Path to the destination
	 * @param {CopyOptions} [options={}] - Copy operation options
	 */
	public copy(
		source: string,
		destination: string,
		options: CopyOptions = {},
	): void {
		const { recursive = false, overwrite = false } = options
		const { silent, force } = this.getErrorOptions(options)
		const sourcePath = path.resolve(this.currentDir, source)
		const destPath = path.resolve(this.currentDir, destination)

		try {
			// Check if source exists
			if (!fs.existsSync(sourcePath)) {
				return this.handleError({
					operation: 'copy',
					message: `cannot copy '${source}': No such file or directory`,
					path: source,
					silent,
					force,
				})
			}

			// Check if destination already exists
			if (fs.existsSync(destPath) && !overwrite) {
				return this.handleError({
					operation: 'copy',
					message: `'${destination}' already exists`,
					path: destination,
					silent,
					force,
				})
			}

			const sourceStats = fs.statSync(sourcePath)

			// Handle file copy
			if (sourceStats.isFile()) {
				try {
					fs.copyFileSync(
						sourcePath,
						destPath,
						overwrite ? undefined : fs.constants.COPYFILE_EXCL,
					)
					if (!silent) {
						this.logger.debug(
							`File copied from ${sourcePath} to ${destPath}`,
						)
					}
				} catch (copyError) {
					return this.handleError({
						operation: 'copy',
						message: `failed to copy '${source}' to '${destination}'`,
						path: source,
						originalError: copyError as Error,
						silent,
						force,
					})
				}
				return
			}

			// Handle directory copy
			if (sourceStats.isDirectory()) {
				if (!recursive) {
					return this.handleError({
						operation: 'copy',
						message: `omitting directory '${source}' (use recursive option to copy)`,
						path: source,
						silent,
						force,
					})
				}

				if (!fs.existsSync(destPath)) {
					fs.mkdirSync(destPath, { recursive: true })
				}

				const files = fs.readdirSync(sourcePath)

				for (const file of files) {
					const srcFile = path.join(source, file)
					const destFile = path.join(destination, file)
					this.copy(srcFile, destFile, {
						recursive,
						overwrite,
						silent,
						force,
					})
				}

				if (!silent) {
					this.logger.debug(
						`Directory copied from ${sourcePath} to ${destPath}`,
					)
				}
				return
			}

			// Handle unsupported file types
			return this.handleError({
				operation: 'copy',
				message: `unsupported file type for '${source}'`,
				path: source,
				silent,
				force,
			})
		} catch (error) {
			return this.handleError({
				operation: 'copy',
				message: `error copying ${source} to ${destination}`,
				path: source,
				originalError: error as Error,
				silent,
				force,
			})
		}
	}

	/**
	 * Moves a file or directory from source to destination
	 * @param {string} source - Path to the source file or directory
	 * @param {string} destination - Path to the destination
	 * @param {MoveOptions} [options={}] - Move operation options
	 */
	public move(
		source: string,
		destination: string,
		options: MoveOptions = {},
	): void {
		const { overwrite = false } = options
		const { silent, force } = this.getErrorOptions(options)
		const sourcePath = path.resolve(this.currentDir, source)
		const destPath = path.resolve(this.currentDir, destination)

		try {
			// Check if source exists
			if (!fs.existsSync(sourcePath)) {
				return this.handleError({
					operation: 'move',
					message: `cannot move '${source}': No such file or directory`,
					path: source,
					silent,
					force,
				})
			}

			// Check if destination already exists
			if (fs.existsSync(destPath) && !overwrite) {
				return this.handleError({
					operation: 'move',
					message: `'${destination}' already exists`,
					path: destination,
					silent,
					force,
				})
			}

			try {
				fs.renameSync(sourcePath, destPath)
				if (!silent) {
					this.logger.debug(`Moved from ${sourcePath} to ${destPath}`)
				}
			} catch (moveError) {
				// If rename fails (possibly due to different filesystems), try copy + delete
				if ((moveError as NodeJS.ErrnoException).code === 'EXDEV') {
					this.copy(source, destination, {
						recursive: true,
						overwrite,
						silent,
						force,
					})
					this.delete(source, {
						recursive: true,
						silent,
						force,
					})
				} else {
					return this.handleError({
						operation: 'move',
						message: `failed to move '${source}' to '${destination}'`,
						path: source,
						originalError: moveError as Error,
						silent,
						force,
					})
				}
			}
		} catch (error) {
			return this.handleError({
				operation: 'move',
				message: `error moving ${source} to ${destination}`,
				path: source,
				originalError: error as Error,
				silent,
				force,
			})
		}
	}

	/**
	 * Renames a file or directory
	 * @param {string} oldPath - Current path of the file or directory
	 * @param {string} newPath - New path for the file or directory
	 */
	public rename(oldPath: string, newPath: string): void {
		const { silent, force } = this.getErrorOptions()
		const resolvedOldPath = path.resolve(this.currentDir, oldPath)
		const resolvedNewPath = path.resolve(this.currentDir, newPath)

		try {
			// Check if source exists
			if (!fs.existsSync(resolvedOldPath)) {
				return this.handleError({
					operation: 'rename',
					message: `cannot rename '${oldPath}': No such file or directory`,
					path: oldPath,
					silent,
					force,
				})
			}

			// Check if destination already exists
			if (fs.existsSync(resolvedNewPath)) {
				return this.handleError({
					operation: 'rename',
					message: `cannot rename to '${newPath}': File exists`,
					path: newPath,
					silent,
					force,
				})
			}

			fs.renameSync(resolvedOldPath, resolvedNewPath)
			if (!silent) {
				this.logger.debug(
					`Renamed from ${resolvedOldPath} to ${resolvedNewPath}`,
				)
			}
		} catch (error) {
			return this.handleError({
				operation: 'rename',
				message: `failed to rename '${oldPath}' to '${newPath}'`,
				path: oldPath,
				originalError: error as Error,
				silent,
				force,
			})
		}
	}

	/**
	 * Reads a file and returns its content
	 * @param {string} filePath - Path to the file to read
	 * @param {ReadFileOptions} [options] - Read operation options
	 * @returns {string|Buffer} File contents as string (if encoding specified) or Buffer
	 */
	public readFile(
		filePath: string,
		options?: ReadFileOptions & { silent?: boolean; force?: boolean },
	): string | Buffer {
		const { silent, force } = this.getErrorOptions(options)
		const resolvedPath = path.resolve(this.currentDir, filePath)

		try {
			if (!fs.existsSync(resolvedPath)) {
				return this.handleError<string | Buffer>({
					operation: 'readFile',
					message: `cannot read '${filePath}': No such file or directory`,
					path: filePath,
					silent,
					force,
					returnValue: Buffer.alloc(0), // Return empty buffer when force=true
				})
			}

			const stats = fs.statSync(resolvedPath)
			if (!stats.isFile()) {
				return this.handleError<string | Buffer>({
					operation: 'readFile',
					message: `cannot read '${filePath}': Is a directory`,
					path: filePath,
					silent,
					force,
					returnValue: Buffer.alloc(0), // Return empty buffer when force=true
				})
			}

			if (options?.encoding) {
				return fs.readFileSync(resolvedPath, {
					encoding: options.encoding,
					flag: options.flag,
				})
			}
			return fs.readFileSync(resolvedPath)
		} catch (error) {
			return this.handleError<string | Buffer>({
				operation: 'readFile',
				message: `error reading ${filePath}`,
				path: filePath,
				originalError: error as Error,
				silent,
				force,
				returnValue: Buffer.alloc(0), // Return empty buffer when force=true
			})
		}
	}

	private handleError<T>(options: {
		operation: string
		message: string
		path?: string
		originalError?: Error
		silent?: boolean
		force?: boolean
		returnValue?: T
	}): T {
		const {
			operation,
			message,
			path,
			originalError,
			silent = false,
			force = false,
		} = options

		// Already handled (and logged) inside the try block: don't re-wrap
		if (originalError instanceof FileSystemError) throw originalError

		const code = (originalError as NodeJS.ErrnoException | undefined)?.code
		const fullMessage = originalError
			? `${operation}: ${message}: ${originalError.message}`
			: `${operation}: ${message}`

		const fsError = new FileSystemError({
			message: fullMessage,
			operation,
			code,
			path,
			originalError,
		})

		// Handle logging (controlled by silent)
		if (!silent) {
			this.logger.error(fullMessage)
		}

		// Handle error propagation (controlled by force)
		if (!force) {
			throw fsError
		}

		// When force=true, return the provided fallback value (or undefined)
		return options.returnValue as T
	}
}
