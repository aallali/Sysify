/* ************************************************************************** */
/*   Copyright 2025 <Sysify>                                                  */
/*                                                                            */
/*   File    : fileSystem.ts                                                  */
/*   Project : Sysify                                                         */
/*   License : MIT                                                            */
/*                                                                            */
/*   Created: 2025/01/07 13:37:00 by aallali                                  */
/*   Updated: 2025/01/11 01:04:30 by aallali                                  */
/* ************************************************************************** */

import fs from 'fs'
import path from 'path'
import logger from './logger'

export class FileSystem {
	private currentDir: string

	constructor() {
		this.currentDir = process.cwd() // Start in the Node.js process's working directory
		logger.info(`Current directory: ${this.pwd()}`)
	}

	public pwd(): string {
		return this.currentDir
	}

	public mkdir(dirName: string): void {
		logger.info(`Creating directory: ${dirName}`)
		// Implement logic
	}

	public cd(dirName: string): void {
		try {
			const newDir = this.resolveCaseInsensitivePath(dirName)

			if (!fs.statSync(newDir).isDirectory()) {
				throw new Error(`cd: not a directory: ${dirName}`)
			}

			this.currentDir = newDir
			logger.info(`Changed directory to: ${this.currentDir}`)
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

	public touch(fileName: string, content: string = ''): void {
		logger.info(`Creating file: ${fileName} with content: ${content}`)
		// Implement logic
	}

	public ls(): string[] {
		logger.info(`Listing files in: ${this.currentDir}`)
		return []
	}

	public save(fileName: string): void {
		logger.info(`Saving file system to: ${fileName}`)
		// Implement logic
	}
}
