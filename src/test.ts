/*
    Copyright 2025 Abdellah Allali
*/

import { FileSystem } from './fileSystem'
import { Logger } from './logger'

const logger = new Logger('test')
logger.setLevel('debug')
logger.testAllTypes()

const test = () => {
	const fs = new FileSystem()
	fs.getLogger().setLevel('error')

	const list = fs.ls()

	// Create a test directory if it doesn't exist
	if (!list.includes('tmp/')) fs.mkdir('tmp')
	fs.cd('tmp')

	// ========== Basic Operations ==========
	logger.warn('========== Basic Operations ==========')
	fs.touch('test.txt', '1337')
	logger.info(`List of files in the [${fs.pwd()}] directory:`, fs.ls())

	// ========== Working with Different File Contents ==========
	logger.warn('========== Working with Different File Contents ==========')

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

	// ========== Demonstrating ReadFile Method ==========
	logger.warn('========== ReadFile Method ==========')
	// Read content as string
	const textContent = fs.readFile('text-file.txt', { encoding: 'utf8' })
	logger.info('Text file content:', textContent)

	// Read binary content
	const binaryContent = fs.readFile('binary-file.bin')
	logger.info('Binary file content (Buffer):', binaryContent)
	logger.info(
		'Binary as string:',
		Buffer.isBuffer(binaryContent)
			? binaryContent.toString()
			: binaryContent,
	)

	// Read multilingual content
	const multilingualContent = fs.readFile('multilingual.txt', {
		encoding: 'utf8',
	})
	logger.info('Multilingual content:', multilingualContent)

	// ========== Demonstrating Copy Method ==========
	logger.warn('========== Copy Method ==========')
	// Create a directory to copy files into
	fs.mkdir('copied-files')

	// Copy a single file
	fs.copy('text-file.txt', 'copied-files/text-file-copy.txt')
	logger.info('After copying file:', fs.ls('copied-files'))

	// Try to read the copied file to verify
	logger.info(
		'Copied file content:',
		fs.readFile('copied-files/text-file-copy.txt', { encoding: 'utf8' }),
	)

	// Create a directory with nested files for recursive copy
	fs.mkdir('nested-dir')
	fs.cd('nested-dir')
	fs.touch('nested-file1.txt', 'Content in nested file 1')
	fs.touch('nested-file2.txt', 'Content in nested file 2')
	fs.mkdir('deeper-dir')
	fs.cd('deeper-dir')
	fs.touch('deepest-file.txt', 'Content in deepest file')
	fs.cd('../..') // Return to tmp directory

	// Copy a directory recursively
	fs.copy('nested-dir', 'copied-files/nested-dir-copy', { recursive: true })
	logger.info('Content of copied directory:', fs.ls('copied-files'))
	logger.info('Nested content:', fs.ls('copied-files/nested-dir-copy'))

	// ========== Demonstrating Move Method ==========
	logger.warn('========== Move Method ==========')

	// Create a directory for moved files
	fs.mkdir('moved-files')

	// Move a file
	fs.touch('file-to-move.txt', 'This file will be moved')
	fs.move('file-to-move.txt', 'moved-files/moved-file.txt')
	logger.info('Files after move operation:', fs.ls('moved-files'))

	// Verify file is no longer in original location
	logger.info(
		'Original directory after move:',
		fs.ls().filter((item) => !item.includes('/')),
	)

	// ========== Demonstrating Rename Method ==========
	logger.warn('========== Rename Method ==========')

	// Rename a file
	fs.touch('original-name.txt', 'This file will be renamed')
	logger.info('Before rename:', fs.ls().includes('original-name.txt'))
	fs.rename('original-name.txt', 'new-name.txt')
	logger.info('After rename:', fs.ls().includes('new-name.txt'))
	logger.info(
		'Original name still exists?',
		fs.ls().includes('original-name.txt'),
	)

	// Create a directory and rename it
	fs.mkdir('old-dirname')
	fs.touch('old-dirname/test.txt', 'Test file in directory to be renamed')
	fs.rename('old-dirname', 'new-dirname')
	logger.info('Directory renamed?', fs.ls().includes('new-dirname/'))
	logger.info('Files in renamed directory:', fs.ls('new-dirname'))

	// ========== Cleanup ==========
	logger.warn('========== Cleanup ==========')
	// cleanup the /tmp folder
	fs.cd('..')
	fs.delete('tmp', { recursive: true })
	logger.info('Cleanup complete. Directory content:', fs.ls())
}

test()
