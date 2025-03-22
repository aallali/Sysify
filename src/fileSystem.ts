/*
	Copyright 2025 Abdellah Allali
*/
import fs from 'node:fs'
import path from 'node:path'
import { Logger, type LogLevel } from './logger'
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

	constructor() {
		const logLevel = (process.env.LOG_LEVEL as LogLevel) || 'warn'
		this.currentDir = process.cwd() // Start in the Node.js process's working directory
		this.logger = new Logger('sysify')
		this.logger.setLevel(logLevel)
		this.logger.debug(`Current directory: ${this.pwd()}`)
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
	 * @throws {Error} If directory already exists or cannot be created
	 * @example
	 * // Create a directory
	 * fs.mkdir('new-directory');
	 *
	 * // Create silently (no error if exists)
	 * fs.mkdir('existing-directory', { silent: true });
	 */
	public mkdir(dirName: string, options: MkdirOptions = {}): void {
		if (!dirName) {
			throw new Error('mkdir: missing operand')
		}
		const newDirPath = path.join(this.currentDir, dirName)

		if (fs.existsSync(newDirPath)) {
			if (!options.silent) {
				this.logger.debug(`Directory already exists: ${newDirPath}`)
				throw new Error(
					`mkdir: cannot create directory '${dirName}': Directory exists`,
				)
			}
			return
		}

		fs.mkdirSync(newDirPath)
		this.logger.debug(`Directory created: ${newDirPath}`)
	}

	/**
	 * Changes the current working directory
	 * @param {string} dirName - Directory path to navigate to (absolute or relative)
	 * @throws {Error} If directory doesn't exist or is not a directory
	 * @example
	 * // Change to subdirectory
	 * fs.cd('projects');
	 *
	 * // Change to parent directory
	 * fs.cd('..');
	 *
	 * // Change to absolute path
	 * fs.cd('/home/user/documents');
	 */
	public cd(dirName: string): void {
		try {
			const newDir = this.resolveCaseInsensitivePath(dirName)

			if (!fs.statSync(newDir).isDirectory()) {
				throw new Error(`cd: not a directory: ${dirName}`)
			}

			this.currentDir = newDir
			this.logger.debug(`Changed directory to: ${this.currentDir}`)
		} catch (error: unknown) {
			let errorMsg = `cd: no such file or directory: ${dirName}`

			// Handle error based on its type
			if (error instanceof Error) {
				errorMsg = `${error.message}`
			}

			this.logger.error(errorMsg)
			throw new Error(errorMsg) // Re-throw the error with a custom message
		}
	}

	private resolveCaseInsensitivePath(dirName: string): string {
		const resolvedPath = path.resolve(this.currentDir, dirName)

		// If the path exists, return it directly
		if (fs.existsSync(resolvedPath)) {
			return resolvedPath
		}

		// Handle case-insensitive resolution
		const parentDir = path.dirname(resolvedPath)
		const targetName = path.basename(resolvedPath)

		if (!fs.existsSync(parentDir)) {
			throw new Error(`cd: no such file or directory: ${parentDir}`)
		}

		const dirContents = fs.readdirSync(parentDir)
		const match = dirContents.find(
			(entry) => entry.toLowerCase() === targetName.toLowerCase(),
		)

		if (!match) {
			throw new Error(`cd: no such file or directory: ${dirName}`)
		}

		return path.join(parentDir, match)
	}

	/**
	 * Creates an empty file or writes content to a new file
	 * @param {string} fileName - Name of the file to create
	 * @param {string|Buffer} [content=''] - Optional content to write to the file
	 * @throws {Error} If file already exists
	 * @example
	 * // Create empty file
	 * fs.touch('newfile.txt');
	 *
	 * // Create file with content
	 * fs.touch('config.json', '{"setting": "value"}');
	 *
	 * // Create file with binary content
	 * fs.touch('data.bin', Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]));
	 */
	public touch(fileName: string, content: string | Buffer = ''): void {
		const newFilePath = path.join(this.currentDir, fileName)

		if (fs.existsSync(newFilePath)) {
			throw new Error(
				`touch: cannot create file '${fileName}': File exists`,
			)
		}

		const bufferContent = Buffer.isBuffer(content)
			? content
			: Buffer.from(content, 'utf-8')
		fs.writeFileSync(newFilePath, bufferContent)
		this.logger.info(`File created: ${newFilePath}`)
	}

	/**
	 * Lists files and directories in the specified path
	 * @param {string} [targetPath] - Path to list contents of (defaults to current directory)
	 * @returns {string[]} Array of file and directory names (directories end with '/')
	 * @throws {Error} If path doesn't exist or is not a directory
	 * @example
	 * // List current directory
	 * const files = fs.ls();
	 * console.log(files); // ['file.txt', 'images/', 'docs/']
	 *
	 * // List specific directory
	 * const subFiles = fs.ls('images');
	 * console.log(subFiles); // ['photo.jpg', 'avatar.png']
	 */
	public ls(targetPath?: string): string[] {
		const dirToRead = targetPath
			? path.resolve(this.currentDir, targetPath)
			: this.currentDir

		if (
			!fs.existsSync(dirToRead) ||
			!fs.statSync(dirToRead).isDirectory()
		) {
			const errorMsg = `Path '${dirToRead}' does not exist or is not a directory.`
			this.logger.error(errorMsg)
			throw new Error(errorMsg)
		}

		try {
			const entries = fs.readdirSync(dirToRead)
			const listing = entries.map((entry) => {
				const fullPath = path.join(dirToRead, entry)
				return fs.statSync(fullPath).isDirectory() ? `${entry}/` : entry
			})

			return listing
		} catch (error: unknown) {
			this.logger.error(
				`Failed to list files in: ${dirToRead} - ${(error as Error).message}`,
			)
			throw error
		}
	}

	/**
	 * Deletes files or directories
	 * @param {string} target - Path to file or directory to delete
	 * @param {DeleteOptions} [options={}] - Delete operation options
	 * @param {boolean} [options.recursive=false] - When true, recursively deletes directories and their contents
	 * @param {boolean} [options.force=false] - When true, ignores non-existent files and suppresses most errors
	 * @param {boolean} [options.silent=false] - When true, suppresses log messages
	 * @throws {Error} If target doesn't exist or is a directory without recursive option
	 * @example
	 * // Delete a file
	 * fs.delete('file.txt');
	 *
	 * // Delete a directory recursively
	 * fs.delete('old-project', { recursive: true });
	 *
	 * // Force delete without errors
	 * fs.delete('maybe-exists.tmp', { force: true });
	 */
	public delete(target: string, options: DeleteOptions = {}): void {
		const { recursive = false, force = false, silent = false } = options
		const targetPath = path.resolve(this.currentDir, target)

		try {
			if (!fs.existsSync(targetPath)) {
				if (!force) {
					throw new Error(
						`delete: cannot delete '${target}': No such file or directory`,
					)
				}
				if (!silent) {
					this.logger.info(`delete: '${target}' does not exist`)
				}
				return
			}

			const stats = fs.statSync(targetPath)

			if (stats.isDirectory()) {
				if (!recursive) {
					throw new Error(
						`delete: '${target}' is a directory (use recursive option to delete)`,
					)
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
		} catch (error: unknown) {
			let errorMsg: string

			// Handle error based on its type
			if (error instanceof Error) {
				errorMsg = `${error.message}`
			} else {
				errorMsg = `delete: error when delete: ${target} : ${JSON.stringify(error)}`
			}

			if (!silent) {
				this.logger.error(errorMsg)
			}
			if (!force) {
				throw new Error(errorMsg)
			}
		}
	}

	/**
	 * Copies a file or directory from source to destination
	 * @param {string} source - Path to the source file or directory
	 * @param {string} destination - Path to the destination
	 * @param {CopyOptions} [options={}] - Copy operation options
	 * @param {boolean} [options.recursive=false] - When true, recursively copies directories
	 * @param {boolean} [options.overwrite=false] - When true, overwrites existing files/directories
	 * @param {boolean} [options.silent=false] - When true, suppresses errors
	 * @throws {Error} If source doesn't exist, destination exists (without overwrite), or copying directory without recursive
	 * @example
	 * // Copy a file
	 * fs.copy('source.txt', 'destination.txt');
	 *
	 * // Copy and overwrite if exists
	 * fs.copy('config.json', 'config.backup.json', { overwrite: true });
	 *
	 * // Copy directory recursively
	 * fs.copy('project', 'project-backup', { recursive: true });
	 */
	public copy(
		source: string,
		destination: string,
		options: CopyOptions = {},
	): void {
		const sourcePath = path.resolve(this.currentDir, source)
		const destPath = path.resolve(this.currentDir, destination)

		if (!fs.existsSync(sourcePath)) {
			throw new Error(
				`copy: cannot copy '${source}': No such file or directory`,
			)
		}

		if (fs.existsSync(destPath) && !options.overwrite) {
			if (options.silent) return
			throw new Error(`copy: '${destination}' already exists`)
		}

		const sourceStats = fs.statSync(sourcePath)

		if (sourceStats.isFile()) {
			try {
				fs.copyFileSync(
					sourcePath,
					destPath,
					options.overwrite ? undefined : fs.constants.COPYFILE_EXCL,
				)
				this.logger.debug(
					`File copied from ${sourcePath} to ${destPath}`,
				)
			} catch (error) {
				this.logger.error(
					`copy: failed to copy '${source}' to '${destination}' | Reason: ${(error as Error).message}`,
				)
				if (!options.silent) {
					throw error
				}
			}
			return
		}

		if (sourceStats.isDirectory()) {
			if (!options.recursive) {
				throw new Error(
					`copy: omitting directory '${source}' (use recursive option to copy)`,
				)
			}

			if (!fs.existsSync(destPath)) {
				fs.mkdirSync(destPath, { recursive: true })
			}

			const files = fs.readdirSync(sourcePath)

			for (const file of files) {
				const srcFile = path.join(source, file)
				const destFile = path.join(destination, file)
				this.copy(srcFile, destFile, options)
			}

			this.logger.debug(
				`Directory copied from ${sourcePath} to ${destPath}`,
			)
			return
		}

		throw new Error(`copy: unsupported file type for '${source}'`)
	}

	/**
	 * Moves a file or directory from source to destination
	 * @param {string} source - Path to the source file or directory
	 * @param {string} destination - Path to the destination
	 * @param {MoveOptions} [options={}] - Move operation options
	 * @param {boolean} [options.overwrite=false] - When true, overwrites existing files/directories
	 * @param {boolean} [options.force=false] - When true, ignores errors
	 * @param {boolean} [options.silent=false] - When true, suppresses errors and logging
	 * @throws {Error} If source doesn't exist or destination exists without overwrite
	 * @example
	 * // Move a file
	 * fs.move('old-location.txt', 'new-location.txt');
	 *
	 * // Move and overwrite if destination exists
	 * fs.move('current.log', 'archive.log', { overwrite: true });
	 *
	 * // Move directory across filesystems (uses copy + delete)
	 * fs.move('/tmp/data', '/home/user/data');
	 */
	public move(
		source: string,
		destination: string,
		options: MoveOptions = {},
	): void {
		const sourcePath = path.resolve(this.currentDir, source)
		const destPath = path.resolve(this.currentDir, destination)

		// Check if source exists
		if (!fs.existsSync(sourcePath)) {
			throw new Error(
				`move: cannot move '${source}': No such file or directory`,
			)
		}

		// Check if destination already exists
		if (fs.existsSync(destPath) && !options.overwrite) {
			if (options.silent) return
			throw new Error(`move: '${destination}' already exists`)
		}

		try {
			fs.renameSync(sourcePath, destPath)
			this.logger.debug(`Moved from ${sourcePath} to ${destPath}`)
		} catch (error) {
			// If rename fails (possibly due to different filesystems), try copy + delete
			if (
				error instanceof Error &&
				'code' in error &&
				error.code === 'EXDEV'
			) {
				this.copy(source, destination, {
					recursive: true,
					force: options.force,
					overwrite: options.overwrite,
					silent: options.silent,
				})
				this.delete(source, {
					recursive: true,
					force: options.force,
					silent: options.silent,
				})
			} else if (!options.silent) {
				throw error
			}
		}
	}

	/**
	 * Renames a file or directory
	 * @param {string} oldPath - Current path of the file or directory
	 * @param {string} newPath - New path for the file or directory
	 * @throws {Error} If source doesn't exist or destination already exists
	 * @example
	 * // Rename a file
	 * fs.rename('oldname.txt', 'newname.txt');
	 *
	 * // Rename a directory
	 * fs.rename('old-directory', 'new-directory');
	 */
	public rename(oldPath: string, newPath: string): void {
		const resolvedOldPath = path.resolve(this.currentDir, oldPath)
		const resolvedNewPath = path.resolve(this.currentDir, newPath)

		// Check if source exists
		if (!fs.existsSync(resolvedOldPath)) {
			throw new Error(
				`rename: cannot rename '${oldPath}': No such file or directory`,
			)
		}

		// Check if destination already exists
		if (fs.existsSync(resolvedNewPath)) {
			throw new Error(
				`rename: cannot rename to '${newPath}': File exists`,
			)
		}

		try {
			fs.renameSync(resolvedOldPath, resolvedNewPath)
			this.logger.debug(
				`Renamed from ${resolvedOldPath} to ${resolvedNewPath}`,
			)
		} catch (error) {
			throw new Error(
				`rename: failed to rename '${oldPath}' to '${newPath}': ${(error as Error).message}`,
			)
		}
	}

	/**
	 * Reads a file and returns its content
	 * @param {string} filePath - Path to the file to read
	 * @param {ReadFileOptions} [options] - Read operation options
	 * @param {BufferEncoding} [options.encoding] - Character encoding for the file
	 * @param {string} [options.flag] - File system flag (e.g., 'r' for read)
	 * @returns {string|Buffer} File contents as string (if encoding specified) or Buffer
	 * @throws {Error} If file doesn't exist or is a directory
	 * @example
	 * // Read as buffer
	 * const binData = fs.readFile('data.bin');
	 *
	 * // Read as UTF-8 string
	 * const textContent = fs.readFile('config.json', { encoding: 'utf8' });
	 *
	 * // Read with specific flag
	 * const content = fs.readFile('important.txt', {
	 *   encoding: 'utf8', // 'utf16le' | 'latin1' | 'base64' | 'hex' | 'ascii' | 'binary' | 'ucs2'
	 *   flag: 'r' // 'r+' | 'rs' | 'rs+' | 'w' | 'wx' | 'w+' | 'wx+'
	 * });
	 */
	public readFile(
		filePath: string,
		options?: ReadFileOptions,
	): string | Buffer {
		const resolvedPath = path.resolve(this.currentDir, filePath)

		if (!fs.existsSync(resolvedPath)) {
			throw new Error(
				`readFile: cannot read '${filePath}': No such file or directory`,
			)
		}

		const stats = fs.statSync(resolvedPath)
		if (!stats.isFile()) {
			throw new Error(
				`readFile: cannot read '${filePath}': Is a directory`,
			)
		}

		if (options?.encoding) {
			return fs.readFileSync(resolvedPath, {
				encoding: options.encoding,
				flag: options.flag,
			})
		}
		return fs.readFileSync(resolvedPath)
	}
}
