/* ************************************************************************** */
/*   Copyright 2025 <Sysify>                                                  */
/*                                                                            */
/*   File    : fileSystem.ts                                                  */
/*   Project : Sysify                                                         */
/*   License : MIT                                                            */
/*                                                                            */
/*   Created: 2025/01/07 13:37:00 by aallali                                  */
/*   Updated: 2025/01/13 22:31:17 by aallali                                  */
/* ************************************************************************** */

import fs from 'fs'
import path from 'path'
import logger from './logger'
import type { DeleteOptions, MkdirOptions } from './fileSystem.type'

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
			} else {
				return
			}
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
				return fs.statSync(fullPath).isDirectory() ? entry + '/' : entry
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
}
