/*
	Copyright 2025 Abdellah Allali
*/

import tmp from 'tmp'
import nodeFS from 'node:fs'
import path from 'node:path'
import { FileSystem } from '../src/fileSystem'

describe('FileSystem - RENAME command', () => {
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

	test('should rename a file', () => {
		const oldName = 'old-name.txt'
		const newName = 'new-name.txt'
		const content = 'Test content'

		fs.touch(oldName, content)
		fs.rename(oldName, newName)

		expect(fs.ls()).not.toContain(oldName)
		expect(fs.ls()).toContain(newName)

		const newPath = path.join(tempDir.name, newName)
		expect(nodeFS.readFileSync(newPath, 'utf-8')).toBe(content)
	})

	test('should rename a directory', () => {
		const oldName = 'old-dir'
		const newName = 'new-dir'

		fs.mkdir(oldName)
		fs.cd(oldName)
		fs.touch('file.txt', 'content')
		fs.cd('..')

		fs.rename(oldName, newName)

		expect(fs.ls()).not.toContain(`${oldName}/`)
		expect(fs.ls()).toContain(`${newName}/`)

		fs.cd(newName)
		expect(fs.ls()).toContain('file.txt')
	})

	test('should throw an error when source does not exist', () => {
		expect(() => {
			fs.rename('nonexistent.txt', 'new-name.txt')
		}).toThrow(
			/rename: cannot rename 'nonexistent.txt': No such file or directory/,
		)
	})

	test('should throw an error when destination already exists', () => {
		const oldName = 'old-name.txt'
		const newName = 'existing-name.txt'

		fs.touch(oldName, 'content')
		fs.touch(newName, 'existing content')

		expect(() => {
			fs.rename(oldName, newName)
		}).toThrow(/rename: cannot rename to 'existing-name.txt': File exists/)
	})

	test('should throw an error when destination is invalid', () => {
		const oldName = 'old-name.txt'
		const newName = 'invalid-folder/existing-name.txt'

		fs.touch(oldName, 'content')

		expect(() => {
			fs.rename(oldName, newName)
		}).toThrow(/ENOENT/)
	})
})
