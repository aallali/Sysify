/*
    Copyright 2025 Abdellah Allali
*/

import { FileSystem } from '../src/fileSystem'
import { Logger } from '../src/logger'

describe('FileSystem - getLogger method', () => {
	let fs: FileSystem

	beforeEach(() => {
		fs = new FileSystem()
	})

	test('should return a Logger instance', () => {
		const logger = fs.getLogger()
		expect(logger).toBeInstanceOf(Logger)
	})

	test("should set logLevel to 'warn' if LOG_LEVEL variable not set in env", () => {
		delete process.env.LOG_LEVEL
		const newFs = new FileSystem()
		expect(newFs.getLogger().getLevel()).toBe('warn')
	})
})
