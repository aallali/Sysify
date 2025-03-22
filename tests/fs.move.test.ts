/*
	Copyright 2025 Abdellah Allali
*/

import tmp from 'tmp'
import nodeFS from 'node:fs'
import path from 'node:path'
import { FileSystem } from '../src/fileSystem'

describe('FileSystem - MOVE command', () => {
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

	test('should move a file to a new location', () => {
		const sourceFile = 'source.txt'
		const content = 'Test content'
		const destFile = 'destination.txt'
		const destPath = path.join(tempDir.name, destFile)

		fs.touch(sourceFile, content)
		fs.move(sourceFile, destFile)

		expect(fs.ls()).not.toContain(sourceFile)
		expect(fs.ls()).toContain(destFile)
		expect(fs.readFile(destPath, { encoding: 'utf-8' })).toBe(content)
	})

	test('should throw an error when source does not exist', () => {
		expect(() => {
			fs.move('nonexistent.txt', 'destination.txt')
		}).toThrow(
			/move: cannot move 'nonexistent.txt': No such file or directory/,
		)
	})

	test('should throw an error when destination already exists', () => {
		const sourceFile = 'source.txt'
		const destFile = 'destination.txt'

		fs.touch(sourceFile, 'content')
		fs.touch(destFile, 'existing content')

		expect(() => {
			fs.move(sourceFile, destFile)
		}).toThrow(/move: 'destination.txt' already exists/)

		expect(() => {
			fs.move(sourceFile, destFile, { silent: true })
		}).not.toThrow()
	})

	test('should move a directory and its contents', () => {
		fs.mkdir('source-dir')
		fs.cd('source-dir')
		fs.touch('file1.txt', 'content 1')
		fs.cd('..')
		fs.move('source-dir', 'dest-dir')

		expect(fs.ls()).not.toContain('source-dir/')
		expect(fs.ls()).toContain('dest-dir/')

		fs.cd('dest-dir')
		expect(fs.ls()).toContain('file1.txt')
	})

	test('should overwrite destination when overwrite option is true', () => {
		const sourceFile = 'source.txt'
		const destFile = 'destination.txt'
		const sourceContent = 'new content'
		const destPath = path.join(tempDir.name, destFile)

		fs.touch(sourceFile, sourceContent)
		fs.touch(destFile, 'old content')
		fs.move(sourceFile, destFile, { overwrite: true })

		expect(fs.ls()).not.toContain(sourceFile)
		expect(fs.ls()).toContain(destFile)
		expect(fs.readFile(destPath, { encoding: 'utf-8' })).toBe(sourceContent)
	})

		const destPath = path.join(tempDir.name, destFile)
		expect(nodeFS.readFileSync(destPath, 'utf-8')).toBe(sourceContent)
	})
})
