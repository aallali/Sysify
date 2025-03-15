/*
	Copyright 2025 Abdellah Allali
*/
import fs from 'node:fs'
import path from 'node:path'
import logger from './logger'
import type {
	DeleteOptions,
	MkdirOptions,
	CopyOptions,
	MoveOptions,
	ReadFileOptions,
} from './fileSystem.type'

export class FileSystem {
	private currentDir: string

	constructor() {
		this.currentDir = process.cwd() // Start in the Node.js process's working directory
		logger.debug(`Current directory: ${this.pwd()}`)
	}

	public pwd(): string {
		return this.currentDir
	}

	public mkdir(dirName: string, options: MkdirOptions = {}): void {
		if (!dirName) {
			throw new Error('mkdir: missing operand')
		}
		const newDirPath = path.join(this.currentDir, dirName)

		if (fs.existsSync(newDirPath)) {
			if (!options.silent) {
				logger.debug(`Directory already exists: ${newDirPath}`)
				throw new Error(
					`mkdir: cannot create directory '${dirName}': Directory exists`,
				)
			}
			return
		}

		fs.mkdirSync(newDirPath)
		logger.debug(`Directory created: ${newDirPath}`)
	}

	public cd(dirName: string): void {
		try {
			const newDir = this.resolveCaseInsensitivePath(dirName)

			if (!fs.statSync(newDir).isDirectory()) {
				throw new Error(`cd: not a directory: ${dirName}`)
			}

			this.currentDir = newDir
			logger.debug(`Changed directory to: ${this.currentDir}`)
		} catch (error: unknown) {
			let errorMsg = `cd: no such file or directory: ${dirName}`

			// Handle error based on its type
			if (error instanceof Error) {
				errorMsg = `${error.message}`
			}

			logger.error(errorMsg)
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
		logger.info(`File created: ${newFilePath}`)
	}

	public ls(targetPath?: string): string[] {
		const dirToRead = targetPath
			? path.resolve(this.currentDir, targetPath)
			: this.currentDir

		if (
			!fs.existsSync(dirToRead) ||
			!fs.statSync(dirToRead).isDirectory()
		) {
			logger.error(
				`Path '${dirToRead}' does not exist or is not a directory.`,
			)
			throw new Error(
				`Path '${dirToRead}' does not exist or is not a directory.`,
			)
		}

		try {
			const entries = fs.readdirSync(dirToRead)
			const listing = entries.map((entry) => {
				const fullPath = path.join(dirToRead, entry)
				return fs.statSync(fullPath).isDirectory() ? `${entry}/` : entry
			})

			return listing
		} catch (error) {
			logger.error(`Failed to list files in: ${dirToRead}`)
			throw error
		}
	}

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
					logger.info(`delete: '${target}' does not exist`)
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
				logger.info(`Deleted: ${targetPath}`)
			}
		} catch (error: unknown) {
			let errorMsg = `delete: error when delete: ${target} : ${JSON.stringify(error)}`

			// Handle error based on its type
			if (error instanceof Error) {
				errorMsg = `${error.message}`
			}

			if (!silent) {
				logger.error(errorMsg)
			}
			if (!force) {
				throw new Error(errorMsg)
			}
		}
	}

	/**
	 * Copies a file or directory from source to destination
	 * @param source - The source file or directory path
	 * @param destination - The destination path
	 * @param options - Options for copy operation
	 */
	public copy(
		source: string,
		destination: string,
		options: CopyOptions = {},
	): void {
		const sourcePath = path.resolve(this.currentDir, source)
		const destPath = path.resolve(this.currentDir, destination)

		// Check if source exists
		if (!fs.existsSync(sourcePath)) {
			throw new Error(
				`copy: cannot copy '${source}': No such file or directory`,
			)
		}

		// Check if destination already exists
		if (fs.existsSync(destPath) && !options.overwrite) {
			if (options.silent) return
			throw new Error(`copy: '${destination}' already exists`)
		}

		const sourceStats = fs.statSync(sourcePath)

		// Handle file copy
		if (sourceStats.isFile()) {
			try {
				fs.copyFileSync(
					sourcePath,
					destPath,
					options.overwrite ? undefined : fs.constants.COPYFILE_EXCL,
				)
				logger.debug(`File copied from ${sourcePath} to ${destPath}`)
			} catch (error) {
				if (!options.silent) {
					throw error
				}
			}
			return
		}

		// Handle directory copy
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

			logger.debug(`Directory copied from ${sourcePath} to ${destPath}`)
			return
		}

		throw new Error(`copy: unsupported file type for '${source}'`)
	}

	/**
	 * Moves a file or directory from source to destination
	 * @param source - The source file or directory path
	 * @param destination - The destination path
	 * @param options - Options for move operation
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
			logger.debug(`Moved from ${sourcePath} to ${destPath}`)
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
	 * @param oldPath - The current path
	 * @param newPath - The new path
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
			logger.debug(
				`Renamed from ${resolvedOldPath} to ${resolvedNewPath}`,
			)
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Unknown error occurred'
			throw new Error(
				`rename: failed to rename '${oldPath}' to '${newPath}': ${errorMessage}`,
			)
		}
	}

	/**
	 * Reads a file and returns its content
	 * @param filePath - Path to the file
	 * @param options - Options for reading the file
	 * @returns The file content as string or Buffer
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

		try {
			if (options?.encoding) {
				return fs.readFileSync(resolvedPath, {
					encoding: options.encoding,
					flag: options.flag,
				})
			}
			return fs.readFileSync(resolvedPath)
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Unknown error occurred'
			throw new Error(
				`readFile: failed to read '${filePath}': ${errorMessage}`,
			)
		}
	}
}
