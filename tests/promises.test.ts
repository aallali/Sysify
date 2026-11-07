/*
	Copyright 2025 Abdellah Allali
*/

import tmp from 'tmp'
import path from 'node:path'
import fsp from 'node:fs/promises'
import { FileSystem as SyncFileSystem } from '../src/fileSystem'
import { FileSystem, FileSystemError } from '../src/promises'

describe('FileSystem (promises)', () => {
	let fs: FileSystem
	let sync: SyncFileSystem
	let tempDir: tmp.DirResult

	beforeEach(async () => {
		tempDir = tmp.dirSync({ unsafeCleanup: true })
		fs = new FileSystem({ silent: true })
		sync = new SyncFileSystem({ silent: true })
		await fs.cd(tempDir.name)
		sync.cd(tempDir.name)
		await fs.touch('file.txt', 'x')
		await fs.mkdir('dir')
	})

	afterEach(() => {
		jest.restoreAllMocks()
		tempDir.removeCallback()
	})

	// Each case runs on both APIs: same code, operation and message
	test.each([
		['mkdir', ''],
		['mkdir', 'dir'],
		['cd', 'nope'],
		['cd', 'file.txt'],
		['touch', 'file.txt'],
		['ls', 'nope'],
		['stat', 'nope'],
		['chmod', 'nope', 0o600],
		['delete', 'nope'],
		['delete', 'dir'],
		['copy', 'nope', 'b'],
		['copy', 'file.txt', 'dir'],
		['copy', 'dir', 'dir2'],
		['move', 'nope', 'b'],
		['move', 'file.txt', 'dir'],
		['rename', 'nope', 'b'],
		['rename', 'file.txt', 'dir'],
		['readFile', 'nope'],
		['readFile', 'dir'],
		['readJson', 'file.txt'],
	])('%s(%s) rejects like the sync API', async (operation, ...args) => {
		type Call = (...a: unknown[]) => unknown
		let expected: FileSystemError | undefined
		try {
			;(sync[operation as keyof SyncFileSystem] as Call).apply(sync, args)
		} catch (error) {
			expected = error as FileSystemError
		}
		expect(expected).toBeDefined()
		const call = (fs[operation as keyof FileSystem] as Call).apply(fs, args)
		await expect(call).rejects.toBeInstanceOf(FileSystemError)
		await expect(call).rejects.toMatchObject({
			operation,
			code: expected!.code,
			message: expected!.message,
		})
	})

	test('happy path mirrors the sync API', async () => {
		await fs.mkdir('a/b', { recursive: true })
		await fs.cd('A') // case-insensitive fallback
		await fs.writeFile('b/one.txt', 'one')
		await fs.writeFile('b/one.txt', '-two', { append: true })
		expect(await fs.readFile('b/one.txt', { encoding: 'utf8' })).toBe(
			'one-two',
		)
		expect(await fs.readFile('b/one.txt')).toEqual(Buffer.from('one-two'))
		await fs.writeJson('b/c.json', { n: 1 }, { atomic: true })
		expect(await fs.readJson('b/c.json')).toEqual({ n: 1 })
		expect((await fs.ls('.', { recursive: true })).sort()).toEqual(
			['b/', 'b/c.json', 'b/one.txt'].sort(),
		)
		await fs.copy('b', 'b2', { recursive: true })
		await fs.move('b2', 'b3')
		await fs.rename('b3/one.txt', 'b3/uno.txt')
		expect(await fs.isFile('b3/uno.txt')).toBe(true)
		expect(await fs.isDir('b3')).toBe(true)
		expect(await fs.exists('b2')).toBe(false)
		await fs.chmod('b3/uno.txt', '600')
		expect((await fs.stat('b3/uno.txt'))!.mode & 0o777).toBe(0o600)
		await fs.delete('b3', { recursive: true })
		expect((await fs.ls()).sort()).toEqual(['b/'])
		expect(fs.pwd()).toBe(path.join(tempDir.name, 'a'))
	})

	test('force resolves fallback values', async () => {
		const opts = { force: true }
		expect(await fs.ls('nope', opts)).toEqual([])
		expect(await fs.stat('nope', opts)).toBeUndefined()
		expect(await fs.readJson('nope', opts)).toBeUndefined()
		expect(await fs.readFile('nope', opts)).toEqual(Buffer.alloc(0))
		expect(await fs.readFile('nope', { ...opts, encoding: 'utf8' })).toBe(
			'',
		)
	})

	test('atomic write cleans up its temp file on failure', async () => {
		await expect(
			fs.writeFile('dir', 'x', { atomic: true }),
		).rejects.toMatchObject({ operation: 'writeFile' })
		expect((await fs.ls()).sort()).toEqual(['dir/', 'file.txt'])
	})

	test('root sandbox rejects with EACCES', async () => {
		const boxed = new FileSystem({ root: tempDir.name, silent: true })
		await expect(boxed.cd('..')).rejects.toMatchObject({
			code: 'EACCES',
			operation: 'cd',
		})
		await expect(boxed.readFile('/etc/hostname')).rejects.toMatchObject({
			code: 'EACCES',
		})
		expect(await boxed.exists('/etc')).toBe(false)
	})

	test('EXDEV fallback keeps the source when copy fails, even with force', async () => {
		const forced = new FileSystem({ force: true, silent: true })
		await forced.cd(tempDir.name)
		jest.spyOn(fsp, 'rename').mockRejectedValue(
			Object.assign(new Error('Cross-device link'), { code: 'EXDEV' }),
		)
		jest.spyOn(fsp, 'copyFile').mockRejectedValue(
			Object.assign(new Error('disk full'), { code: 'ENOSPC' }),
		)
		await forced.move('file.txt', 'moved.txt')
		expect(await forced.readFile('file.txt', { encoding: 'utf8' })).toBe(
			'x',
		)
	})

	test('EXDEV falls back to copy + delete', async () => {
		jest.spyOn(fsp, 'rename').mockRejectedValueOnce(
			Object.assign(new Error('Cross-device link'), { code: 'EXDEV' }),
		)
		await fs.move('file.txt', 'moved.txt')
		expect(await fs.exists('file.txt')).toBe(false)
		expect(await fs.readFile('moved.txt', { encoding: 'utf8' })).toBe('x')
	})
})
