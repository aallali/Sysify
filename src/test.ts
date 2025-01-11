/* ************************************************************************** */
/*   Copyright 2025 <Sysify>                                                  */
/*                                                                            */
/*   File    : test.ts                                                        */
/*   Project : Sysify                                                         */
/*   License : MIT                                                            */
/*                                                                            */
/*   Created: 2025/01/11 11:43:23 by aallali                                  */
/*   Updated: 2025/01/11 13:42:14 by aallali                                  */
/* ************************************************************************** */

import { FileSystem } from './fileSystem'
import logger from './logger'

const USERNAME = process.env.USER || ''

const test = () => {
	const fs = new FileSystem()

	fs.cd('/')
	fs.cd('../')
	try {
		// path doesn't exist
		fs.cd('src/')
	} catch {
		/* empty */
	}
	fs.cd(`home/${USERNAME}/SySiFy`) // handles case-insensitive paths
	logger.info(`List of files in the ${fs.pwd()} directory:`, fs.ls())
	// test all logger methods
	logger.info('info message')
	logger.warn('warn message')
	logger.error('error message')
	logger.debug('debug message')
	logger.info('info message with args', { arg1: false }, 'arg2')
}

test()
