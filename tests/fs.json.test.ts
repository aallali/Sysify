/*
	Copyright 2025 Abdellah Allali
*/

import tmp from 'tmp'
import { FileSystem } from '../src/fileSystem'

describe('FileSystem - readJson / writeJson', () => {
	let fs: FileSystem
	let tempDir: tmp.DirResult

	beforeEach(() => {
		tempDir = tmp.dirSync({ unsafeCleanup: true })
		fs = new FileSystem({ silent: true })
		fs.cd(tempDir.name)
	})

	afterEach(() => tempDir.removeCallback())

	test('round-trips a value, pretty-printed with a trailing newline', () => {
		fs.writeJson('a.json', { a: [1, 2] })
		expect(fs.readFile('a.json', { encoding: 'utf8' })).toBe(
			'{\n  "a": [\n    1,\n    2\n  ]\n}\n',
		)
		expect(fs.readJson<{ a: number[] }>('a.json')).toEqual({ a: [1, 2] })
	})

	test('honors spaces and atomic', () => {
		fs.writeJson('a.json', { a: 1 }, { spaces: 0, atomic: true })
		expect(fs.readFile('a.json', { encoding: 'utf8' })).toBe('{"a":1}\n')
	})

	test('throws EJSON for invalid JSON', () => {
		fs.writeFile('bad.json', '{nope')
		expect(() => fs.readJson('bad.json')).toThrow(
			expect.objectContaining({ code: 'EJSON', operation: 'readJson' }),
		)
	})

	test('throws ENOENT for a missing file, undefined with force', () => {
		expect(() => fs.readJson('missing.json')).toThrow(
			expect.objectContaining({ code: 'ENOENT' }),
		)
		expect(fs.readJson('missing.json', { force: true })).toBeUndefined()
	})
})
