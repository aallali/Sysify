/*
	Copyright 2025 Abdellah Allali
*/

import tmp from 'tmp'
import { FileSystem } from '../src/fileSystem'

describe('FileSystem - EXISTS / STAT commands', () => {
	let fs: FileSystem
	let tempDir: tmp.DirResult

	beforeEach(() => {
		tempDir = tmp.dirSync({ unsafeCleanup: true })
		fs = new FileSystem()
		fs.cd(tempDir.name)
	})

	afterEach(() => tempDir.removeCallback())

	test('exists returns true for files and directories, false otherwise', () => {
		fs.touch('a.txt')
		fs.mkdir('dir')
		expect(fs.exists('a.txt')).toBe(true)
		expect(fs.exists('dir')).toBe(true)
		expect(fs.exists(`${tempDir.name}/a.txt`)).toBe(true)
		expect(fs.exists('nope')).toBe(false)
	})

	test('stat returns file metadata', () => {
		fs.touch('a.txt', '12345')
		const stats = fs.stat('a.txt')!
		expect(stats.isFile()).toBe(true)
		expect(stats.size).toBe(5)
		expect(fs.stat('.')!.isDirectory()).toBe(true)
	})
})
