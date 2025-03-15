/*
	Copyright 2025 Abdellah Allali
*/

import tmp from 'tmp'
import nodeFS from 'node:fs'
import path from 'node:path'
import { FileSystem } from '../src/fileSystem'

describe('FileSystem - COPY command', () => {
	let fs: FileSystem
	let tempDir: tmp.DirResult

	beforeEach(() => {
		tempDir = tmp.dirSync({ unsafeCleanup: true })
		fs = new FileSystem()
		fs.cd(tempDir.name)
	})

	afterEach(() => {
		tempDir.removeCallback() // Automatically deletes temp directory
	})

	test('should copy a file to a new location', () => {
		const sourceFile = 'source.txt'
		const content = 'Test content'
		const destFile = 'destination.txt'

		fs.touch(sourceFile, content)
		fs.copy(sourceFile, destFile)

		expect(fs.ls()).toContain(sourceFile)
		expect(fs.ls()).toContain(destFile)

		const destPath = path.join(tempDir.name, destFile)
		expect(nodeFS.readFileSync(destPath, 'utf-8')).toBe(content)
	})

	test('should throw an error when source does not exist', () => {
		expect(() => {
			fs.copy('nonexistent.txt', 'destination.txt')
		}).toThrow(
			/copy: cannot copy 'nonexistent.txt': No such file or directory/,
		)
	})

	test('should throw an error when destination already exists', () => {
		const sourceFile = 'source.txt'
		const destFile = 'destination.txt'

		fs.touch(sourceFile, 'content')
		fs.touch(destFile, 'existing content')

		expect(() => {
			fs.copy(sourceFile, destFile)
		}).toThrow(/copy: 'destination.txt' already exists/)
	})

	test('should copy a directory recursively', () => {
		// Create source directory structure
		fs.mkdir('source-dir')
		fs.cd('source-dir')
		fs.touch('file1.txt', 'content 1')
		fs.touch('file2.txt', 'content 2')
		fs.mkdir('subdir')
		fs.cd('subdir')
		fs.touch('file3.txt', 'content 3')
		fs.cd('../..')

		// Copy the directory
		fs.copy('source-dir', 'dest-dir', { recursive: true })

		// Verify the copied structure
		expect(fs.ls()).toContain('source-dir/')
		expect(fs.ls()).toContain('dest-dir/')

		fs.cd('dest-dir')
		expect(fs.ls()).toContain('file1.txt')
		expect(fs.ls()).toContain('file2.txt')
		expect(fs.ls()).toContain('subdir/')

		fs.cd('subdir')
		expect(fs.ls()).toContain('file3.txt')
	})

	test('should throw an error when copying directory without recursive option', () => {
		fs.mkdir('source-dir')

		expect(() => {
			fs.copy('source-dir', 'dest-dir')
		}).toThrow(
			/copy: omitting directory 'source-dir' \(use recursive option to copy\)/,
		)
	})

	test('should overwrite destination when overwrite option is true', () => {
		const sourceFile = 'source.txt'
		const destFile = 'destination.txt'
		const sourceContent = 'new content'

		fs.touch(sourceFile, sourceContent)
		fs.touch(destFile, 'old content')

		fs.copy(sourceFile, destFile, { overwrite: true })

		const destPath = path.join(tempDir.name, destFile)
		expect(nodeFS.readFileSync(destPath, 'utf-8')).toBe(sourceContent)
	})
})
