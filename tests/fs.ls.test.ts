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

	test('should throw error when directory is not readable', () => {
		let unreadableDir = 'unreadable-dir'
		const tempDir = tmp.dirSync({ unsafeCleanup: true })
		const fs_ = new FileSystem()
		fs_.cd(tempDir.name)
		// Create a directory with restricted permissions
		unreadableDir = path.join(tempDir.name, 'unreadable-dir')
		nodeFS.mkdirSync(unreadableDir)
		// Only run this test if we're not on Windows (chmod works differently there)
		if (process.platform !== 'win32') {
			// Make the directory unreadable
			nodeFS.chmodSync(unreadableDir, 0)

			// Attempt to list the contents should fail with EACCES
			fs_.cd(tempDir.name)
			expect(() => fs_.ls('unreadable-dir')).toThrow(
				/^EACCES: permission denied, scandir/,
			)
		}
		// Fix permissions to allow cleanup
		try {
			nodeFS.chmodSync(unreadableDir, 493)
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (e) {
			// Ignore any errors during cleanup
		}
		tempDir.removeCallback()
	})
})
