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

	test('isFile / isDir', () => {
		fs.touch('a.txt')
		fs.mkdir('dir')
		expect([fs.isFile('a.txt'), fs.isDir('a.txt')]).toEqual([true, false])
		expect([fs.isFile('dir'), fs.isDir('dir')]).toEqual([false, true])
		expect([fs.isFile('nope'), fs.isDir('nope')]).toEqual([false, false])
	})

	test('chmod accepts numeric and string modes', () => {
		fs.touch('a.txt')
		fs.chmod('a.txt', 0o600)
		expect(fs.stat('a.txt')!.mode & 0o777).toBe(0o600)
		fs.chmod('a.txt', '755')
		expect(fs.stat('a.txt')!.mode & 0o777).toBe(0o755)
		expect(() => fs.chmod('nope', 0o600, { silent: true })).toThrow(
			expect.objectContaining({ code: 'ENOENT', operation: 'chmod' }),
		)
	})

	test('ls recursive lists nested entries relative to the directory', () => {
		fs.mkdir('d/e', { recursive: true })
		fs.touch('d/e/f.txt')
		fs.touch('top.txt')
		expect(fs.ls('.', { recursive: true }).sort()).toEqual(
			['d/', 'd/e/', 'd/e/f.txt', 'top.txt'].sort(),
		)
	})
})
