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

	fs.cd('/')
	fs.cd('../')
	try {
		fs.cd('src/')
	} catch {
		/* empty */
	}

	// test all logger methods
	logger.info('info message')
	logger.warn('warn message')
	logger.error('error message')
	logger.debug('debug message')
	logger.info('info message with args', 'arg1', 'arg2')
}

// Run the main function
main()
