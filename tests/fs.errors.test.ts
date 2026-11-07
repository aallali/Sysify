/*
	Copyright 2025 Abdellah Allali
*/

import tmp from 'tmp'
import { FileSystem } from '../src/fileSystem'
import { FileSystemError } from '../src/fileSystem.error'

/** Runs fn and returns the thrown error (fails the test if nothing is thrown). */
function catchError(fn: () => unknown): FileSystemError {
	try {
		fn()
	} catch (error) {
		return error as FileSystemError
	}
	throw new Error('expected function to throw')
}

describe('FileSystem - error handling', () => {
	let fs: FileSystem
	let tempDir: tmp.DirResult

	beforeEach(() => {
		tempDir = tmp.dirSync({ unsafeCleanup: true })
		fs = new FileSystem()
		fs.cd(tempDir.name)
		fs.touch('file.txt', 'x')
		fs.mkdir('dir')
	})

	afterEach(() => {
		jest.restoreAllMocks()
		tempDir.removeCallback()
	})

	test.each([
		['mkdir', () => fs.mkdir(''), 'EINVAL'],
		['mkdir', () => fs.mkdir('dir'), 'EEXIST'],
		['cd', () => fs.cd('nope'), 'ENOENT'],
		['cd', () => fs.cd('file.txt'), 'ENOTDIR'],
		['touch', () => fs.touch('file.txt'), 'EEXIST'],
		['ls', () => fs.ls('nope'), 'ENOENT'],
		['stat', () => fs.stat('nope'), 'ENOENT'],
		['delete', () => fs.delete('nope'), 'ENOENT'],
		['delete', () => fs.delete('dir'), 'EISDIR'],
		['copy', () => fs.copy('nope', 'b'), 'ENOENT'],
		['copy', () => fs.copy('file.txt', 'dir'), 'EEXIST'],
		['copy', () => fs.copy('dir', 'dir2'), 'EISDIR'],
		['move', () => fs.move('nope', 'b'), 'ENOENT'],
		['move', () => fs.move('file.txt', 'dir'), 'EEXIST'],
		['rename', () => fs.rename('nope', 'b'), 'ENOENT'],
		['rename', () => fs.rename('file.txt', 'dir'), 'EEXIST'],
		['readFile', () => fs.readFile('nope'), 'ENOENT'],
		['readFile', () => fs.readFile('dir'), 'EISDIR'],
	])('%s throws FileSystemError with code %#', (operation, fn, code) => {
		const error = catchError(fn)
		expect(error).toBeInstanceOf(FileSystemError)
		expect(error).toMatchObject({
			name: 'FileSystemError',
			operation,
			code,
		})
		expect(error.message.startsWith(`${operation}: `)).toBe(true)
	})

	test('wraps Node errors and keeps their code and original error', () => {
		const error = catchError(() => fs.rename('file.txt', 'nope/file.txt'))
		expect(error.code).toBe('ENOENT')
		expect(error.originalError).toBeDefined()
		expect(error.path).toBe('file.txt')
	})

	test('force=true returns fallback values instead of throwing', () => {
		const opts = { force: true, silent: true }
		expect(fs.ls('nope', opts)).toEqual([])
		expect(fs.stat('nope', opts)).toBeUndefined()
		expect(fs.readFile('nope', opts)).toEqual(Buffer.alloc(0))
		expect(fs.readFile('nope', { ...opts, encoding: 'utf8' })).toBe('')
		expect(() => fs.rename('nope', 'b', opts)).not.toThrow()
		expect(() => fs.cd('nope', opts)).not.toThrow()
	})

	test('silent=true still throws but does not log', () => {
		const spy = jest.spyOn(fs.getLogger(), 'error')
		expect(() => fs.ls('nope', { silent: true })).toThrow(FileSystemError)
		expect(spy).not.toHaveBeenCalled()
		expect(() => fs.ls('nope')).toThrow(FileSystemError)
		expect(spy).toHaveBeenCalledTimes(1)
	})

	test('constructor defaults apply, per-call options override them', () => {
		const lenient = new FileSystem({ force: true, silent: true })
		lenient.cd(tempDir.name)
		expect(lenient.ls('nope')).toEqual([])
		expect(() => lenient.ls('nope', { force: false })).toThrow(
			FileSystemError,
		)
	})

	test('constructor logLevel overrides LOG_LEVEL env', () => {
		expect(
			new FileSystem({ logLevel: 'debug' }).getLogger().getLevel(),
		).toBe('debug')
	})
})
