/*
	Copyright 2025 Abdellah Allali
*/

import tmp from 'tmp'
import path from 'node:path'
import { FileSystem } from '../src/fileSystem'

describe('FileSystem - root sandbox', () => {
	let fs: FileSystem
	let tempDir: tmp.DirResult

	beforeEach(() => {
		tempDir = tmp.dirSync({ unsafeCleanup: true })
		fs = new FileSystem({ root: tempDir.name, silent: true })
	})

	afterEach(() => tempDir.removeCallback())

	test('starts in root and allows paths inside it', () => {
		expect(fs.pwd()).toBe(tempDir.name)
		fs.mkdir('a/b', { recursive: true })
		fs.cd('a/b')
		fs.writeFile(path.join(tempDir.name, 'abs.txt'), 'x')
		expect(fs.exists('../../abs.txt')).toBe(true)
	})

	test.each([
		['cd', (f: FileSystem) => f.cd('..')],
		['ls', (f: FileSystem) => f.ls('/')],
		['writeFile', (f: FileSystem) => f.writeFile('../escape.txt', 'x')],
		['readFile', (f: FileSystem) => f.readFile('/etc/hostname')],
		['copy', (f: FileSystem) => f.copy('/etc/hostname', 'h')],
		['delete', (f: FileSystem) => f.delete('../x')],
	])('%s outside root fails with EACCES', (operation, call) => {
		expect(() => call(fs)).toThrow(
			expect.objectContaining({
				code: 'EACCES',
				operation,
				message: expect.stringContaining('is outside the root'),
			}),
		)
		expect(fs.pwd()).toBe(tempDir.name)
	})

	test('rejects a sibling dir sharing the root prefix', () => {
		expect(() => fs.ls(`${tempDir.name}-other`)).toThrow(
			expect.objectContaining({ code: 'EACCES' }),
		)
	})

	test('query helpers return false outside root', () => {
		expect(fs.exists('/etc')).toBe(false)
		expect(fs.isDir('..')).toBe(false)
	})

	test('throws ENOTDIR for a missing root', () => {
		expect(
			() => new FileSystem({ root: path.join(tempDir.name, 'nope') }),
		).toThrow(expect.objectContaining({ code: 'ENOTDIR' }))
	})
})
