/* ************************************************************************** */
/*   Copyright 2025 <Sysify>                                                  */
/*                                                                            */
/*   File    : fileSystem.ts                                                  */
/*   Project : Sysify                                                         */
/*   License : MIT                                                            */
/*                                                                            */
/*   Created: 2025/01/07 13:37:00 by aallali                                  */
/*   Updated: 2025/01/07 13:37:00 by aallali                                  */
/* ************************************************************************** */

import logger from "./logger"

export class FileSystem {
	private currentDir: string = '/'

	public mkdir(dirName: string): void {
		logger.info(`Creating directory: ${dirName}`)
		// Implement logic
	}

	public cd(dirName: string): void {
		logger.info(`Changing directory to: ${dirName}`)
		// Implement logic
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
