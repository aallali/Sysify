/*
	Copyright 2025 Abdellah Allali
*/

import tmp from 'tmp'
import nodeFS from 'node:fs'
import path from 'node:path'
import { FileSystem } from '../src/fileSystem'

describe('FileSystem - LS command', () => {
	let fs: FileSystem

	beforeEach(() => {
		fs = new FileSystem()
	})

	test('should return list of files in the current directory', () => {
		expect(fs.ls()).toEqual(
			expect.arrayContaining(['src/', 'tests/', 'package.json']),
		)
	})

	test('should return list of files in the specified directory', () => {
		expect(fs.ls('src')).toEqual(
			expect.arrayContaining(['index.ts', 'fileSystem.ts']),
		)
	})

	test('should throw error given non-existent-dir to LS', () => {
		const invalidDir = 'non-existent-dir'
		expect(() => fs.ls(invalidDir)).toThrow(
			/does not exist or is not a directory\.$/i,
		)
	})

	// test for files match fs.*.test.ts inside tests/
	test('should return list of files that match the pattern', () => {
		expect(fs.ls('tests')).toEqual(
			expect.arrayContaining([
				expect.stringMatching(/^fs\.\w+\.test\.ts$/i),
			]),
		)
	})

	// chmod is a no-op on Windows
	const itPosix = process.platform === 'win32' ? test.skip : test
	itPosix('should throw error when directory is not readable', () => {
		const tempDir = tmp.dirSync({ unsafeCleanup: true })
		const unreadableDir = path.join(tempDir.name, 'unreadable-dir')
		const fs_ = new FileSystem()
		fs_.cd(tempDir.name)
		nodeFS.mkdirSync(unreadableDir, { mode: 0 })
		try {
			expect(() => fs_.ls('unreadable-dir')).toThrow(
				/^EACCES: permission denied, scandir/,
			)
		} finally {
			nodeFS.chmodSync(unreadableDir, 0o755)
			tempDir.removeCallback()
		}
	})
})
