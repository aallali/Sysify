/*
	Copyright 2025 Abdellah Allali
*/

import tmp from 'tmp'
import { FileSystem } from '../src/fileSystem'
import { existsSync } from 'node:fs'
import path from 'node:path'

describe('FileSystem - MKDIR command', () => {
	let fs: FileSystem
	let tempDir: string

	// OS temp dir, not cwd: the ls suite lists cwd in parallel
	let tempDirResult: tmp.DirResult

	beforeEach(() => {
		tempDirResult = tmp.dirSync({ unsafeCleanup: true })
		tempDir = tempDirResult.name
		fs = new FileSystem()
		fs.cd(tempDir)
	})

	afterEach(() => {
		tempDirResult.removeCallback()
	})

	test('should throw error when no input given', () => {
		expect(() => {
			fs.mkdir('')
		}).toThrow('mkdir: missing operand')
	})

	test('should create a new directory in the current directory', () => {
		fs.mkdir('new-dir')
		expect(fs.ls()).toContain('new-dir/')
	})

	test('should throw an error if the directory already exists', () => {
		const src = 'existing-dir'
		fs.mkdir(src)
		expect(() => {
			fs.mkdir(src)
		}).toThrow(`mkdir: cannot create directory '${src}': Directory exists`)
	})

	test('should not throw an error if the directory already exists and options.force=true', () => {
		expect(() => {
			fs.mkdir('existing-dir-2')
			fs.mkdir('existing-dir-2', { force: true })
		}).not.toThrow()
	})

	test('should allow creating multiple directories', () => {
		fs.mkdir('dir1')
		fs.mkdir('dir2')
		expect(fs.ls()).toEqual(expect.arrayContaining(['dir1/', 'dir2/']))
	})

	test('should treat an absolute path as absolute', () => {
		const absDir = path.join(fs.pwd(), 'abs-dir')
		fs.cd('..')
		fs.mkdir(absDir)
		expect(existsSync(absDir)).toBe(true)
		fs.cd(tempDir)
	})
})
