/* ************************************************************************** */
/*   Copyright 2025 <Sysify>                                                  */
/*                                                                            */
/*   File    : test.ts                                                        */
/*   Project : Sysify                                                         */
/*   License : MIT                                                            */
/*                                                                            */
/*   Created: 2025/01/11 11:43:23 by aallali                                  */
/*   Updated: 2025/01/13 18:17:18 by aallali                                  */
/* ************************************************************************** */

import { FileSystem } from './fileSystem'
import { Logger } from './logger'

const logger = new Logger('debug', 'test')

const test = () => {
	const fs = new FileSystem()

	const list = fs.ls()

	if (!list.includes('tmp/')) fs.mkdir('tmp')

	fs.cd('tmp')
	fs.touch('test.txt', '1337')

	logger.info(`List of files in the \n[${fs.pwd()}] directory:`, fs.ls())

	// Save a file with a UTF-8 string
	fs.touch('text-file.txt', 'This is a UTF-8 string.')

	// Save a file with binary data (Buffer)
	const binaryData = Buffer.from([0x42, 0x69, 0x6e, 0x61, 0x72, 0x79]) // Represents "Binary"
	fs.touch('binary-file.bin', binaryData)

	// Save a file with encoded text (e.g., Base64)
	const base64Content = Buffer.from('Hello, world!').toString('base64')
	const decodedBuffer = Buffer.from(base64Content, 'base64')
	fs.touch('decoded-file.txt', decodedBuffer)

	// Save multilingual content with UTF-8 encoding
	fs.touch('multilingual.txt', 'السلام عليكم (Hello, World!)')

	// cleanup the /tmp folder
	fs.delete('../tmp', { recursive: true })
}

test()
