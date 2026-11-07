/*
	Copyright 2025 Abdellah Allali
*/

import tmp from 'tmp'
import { FileSystem } from '../src/fileSystem'

describe('FileSystem - WRITEFILE command', () => {
	let fs: FileSystem
	let tempDir: tmp.DirResult

	beforeEach(() => {
		tempDir = tmp.dirSync({ unsafeCleanup: true })
		fs = new FileSystem()
		fs.cd(tempDir.name)
	})

	afterEach(() => tempDir.removeCallback())

	test('should create a file', () => {
		fs.writeFile('a.txt', 'hello')
		expect(fs.readFile('a.txt', { encoding: 'utf8' })).toBe('hello')
	})

	test('should overwrite an existing file', () => {
		fs.touch('a.txt', 'old')
		fs.writeFile('a.txt', 'new')
		expect(fs.readFile('a.txt', { encoding: 'utf8' })).toBe('new')
	})

	test('should append with append=true', () => {
		fs.writeFile('a.txt', 'one')
		fs.writeFile('a.txt', Buffer.from('-two'), { append: true })
		expect(fs.readFile('a.txt', { encoding: 'utf8' })).toBe('one-two')
	})

	test('should honor encoding for string data', () => {
		fs.writeFile('a.bin', '68690a', { encoding: 'hex' })
		expect(fs.readFile('a.bin', { encoding: 'utf8' })).toBe('hi\n')
	})

	test('should throw ENOENT when the parent directory is missing', () => {
		expect(() => fs.writeFile('missing/a.txt', 'x')).toThrow(
			expect.objectContaining({ code: 'ENOENT', operation: 'writeFile' }),
		)
	})

	test('should throw EISDIR when target is a directory', () => {
		fs.mkdir('dir')
		expect(() => fs.writeFile('dir', 'x')).toThrow(
			expect.objectContaining({ code: 'EISDIR' }),
		)
	})
})
