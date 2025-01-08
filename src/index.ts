/* ************************************************************************** */
/*   Copyright 2025 <Sysify>                                                  */
/*                                                                            */
/*   File    : index.ts                                                       */
/*   Project : Sysify                                                         */
/*   License : MIT                                                            */
/*                                                                            */
/*   Created: 2025/01/07 13:37:00 by aallali                                  */
/*   Updated: 2025/01/11 01:00:35 by aallali                                  */
/* ************************************************************************** */

import { FileSystem } from './fileSystem'
import logger from './logger'

const main = () => {
	const fs = new FileSystem()

	// print all log levels
	logger.debug('Debug message')
	logger.info('Info message')
	logger.warn('Warn message')
	logger.error('Error message')
	
	// Create a new directory
	fs.mkdir('documents')

	// Change to the new directory
	fs.cd('documents')

	// Create a new file in the current directory
	fs.touch('notes.txt', 'This is a simple note.')

	// List the contents of the current directory
	logger.info("Contents of 'documents':", fs.ls())

	// Save the current file system to a JSON file
	fs.save('filesystem.json')

	logger.info('File System operations completed.')
}

// Run the main function
main()
