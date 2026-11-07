/*
	Copyright 2025 Abdellah Allali
*/

import { Logger } from '../src/logger'

describe('Logger', () => {
	const isTTY = process.stdout.isTTY
	let spy: jest.SpyInstance

	beforeEach(() => {
		spy = jest.spyOn(console, 'error').mockImplementation(() => {})
	})

	afterEach(() => {
		spy.mockRestore()
		process.stdout.isTTY = isTTY
		delete process.env.NO_COLOR
	})

	const logOnce = (): string => {
		new Logger('t').error('boom')
		return spy.mock.calls[0][0] as string
	}

	test('colors output on a TTY', () => {
		process.stdout.isTTY = true
		expect(logOnce()).toContain('\x1b[')
	})

	test('no colors when NO_COLOR is set', () => {
		process.stdout.isTTY = true
		process.env.NO_COLOR = '1'
		expect(logOnce()).not.toContain('\x1b[')
	})

	test('no colors when output is not a TTY', () => {
		process.stdout.isTTY = false
		const line = logOnce()
		expect(line).not.toContain('\x1b[')
		expect(line).toMatch(/\[ERROR\]\[t\]:boom$/)
	})

	test('respects level and off', () => {
		const logger = new Logger('t')
		logger.setLevel('off')
		logger.error('hidden')
		expect(spy).not.toHaveBeenCalled()
	})
})
