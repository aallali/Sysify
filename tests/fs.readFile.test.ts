/*
	Copyright 2025 Abdellah Allali
*/

import tmp from 'tmp'
import { FileSystem } from '../src/fileSystem'
import nodeFS from 'node:fs'
import path from 'node:path'

describe('FileSystem - READFILE command', () => {
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

	test('should read file content as string with default encoding', () => {
		const fileName = 'test.txt'
		const content = 'Hello, world!'

		fs.touch(fileName, content)

		const result = fs.readFile(fileName, { encoding: 'utf8' })
		expect(result).toBe(content)
	})

	test('should read file content as Buffer when no encoding is specified', () => {
		const fileName = 'binary.bin'
		const content = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]) // "Hello" in hex

		fs.touch(fileName, content)

		const result = fs.readFile(fileName)
		expect(Buffer.isBuffer(result)).toBe(true)
		expect(result).toEqual(content)
	})

	test('should read file with different encodings', () => {
		const fileName = 'encoded.txt'
		const content = 'Hello, 世界!' // Mixed ASCII and Unicode

		fs.touch(fileName, content)

		const utf8Result = fs.readFile(fileName, { encoding: 'utf8' })
		const base64Result = fs.readFile(fileName, { encoding: 'base64' })
		const base64Buffer = Buffer.from(base64Result as string, 'base64')
		expect(utf8Result).toBe(content)
		expect(typeof base64Result).toBe('string')
		expect(base64Buffer.toString('utf8')).toBe(content)
	})

	test('should throw an error when file does not exist', () => {
		expect(() => {
			fs.readFile('nonexistent.txt')
		}).toThrow(
			/readFile: cannot read 'nonexistent.txt': No such file or directory/,
		)
	})

	test('should throw an error when path is a directory', () => {
		const dirName = 'test-dir'

		fs.mkdir(dirName)

		expect(() => {
			fs.readFile(dirName)
		}).toThrow(/readFile: cannot read 'test-dir': Is a directory/)
	})

	test('should throw an error when path is a directory', () => {
		const sourceFile = 'source.txt'
		expect(() => {
			fs.touch(sourceFile, '#######')
			nodeFS.chmodSync(path.join(`${fs.pwd()}/`, sourceFile), 0o000)

			fs.readFile(sourceFile)
		}).toThrow(/EACCES: permission denied, open/)
		nodeFS.chmodSync(path.join(`${fs.pwd()}/`, sourceFile), 0o644)
	})
})
