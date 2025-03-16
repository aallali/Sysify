/*
    Copyright 2025 Abdellah Allali
*/

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'off'

export class Logger {
	private logLevel: LogLevel = 'warn'
	private static readonly LEVELS: LogLevel[] = [
		'debug',
		'info',
		'warn',
		'error',
	]

	// Enhanced color scheme for better visual distinction
	private static readonly COLORS: Record<LogLevel, string> = {
		debug: '\x1b[37m', // Bright gray
		info: '\x1b[36m', // Cyan
		warn: '\x1b[33m', // Yellow
		error: '\x1b[91m', // Bright red
		off: '\x1b[37m', // White (default, unused)
	}
	private static readonly RESET_COLOR = '\x1b[0m'
	private static readonly TIMESTAMP_COLOR = '\x1b[32m' // Green
	private static readonly SOURCE_COLOR = '\x1b[35m' // Magenta
	private static readonly MESSAGE_COLORS: Record<LogLevel, string> = {
		debug: '\x1b[37m', // White for debug messages
		info: '\x1b[97m', // Bright white for info
		warn: '\x1b[33m', // Yellow for warnings
		error: '\x1b[91m', // Bright red for errors
		off: '\x1b[37m', // White (default, unused)
	}

	constructor(private readonly source: string) {
		this.source = ` [${source}]`
	}

	public setLevel(level: LogLevel): void {
		this.logLevel = level
	}

	public debug(message: string, ...args: unknown[]): void {
		this.log('debug', message, ...args)
	}

	public info(message: string, ...args: unknown[]): void {
		this.log('info', message, ...args)
	}

	public warn(message: string, ...args: unknown[]): void {
		this.log('warn', message, ...args)
	}

	public error(message: string, ...args: unknown[]): void {
		this.log('error', message, ...args)
	}

	private log(level: LogLevel, message: string, ...args: unknown[]): void {
		if (!this.shouldLog(level)) return

		const timestamp = this.formatTimestamp()
		const coloredLevel = `${Logger.COLORS[level]}[${level.toUpperCase()}]`
		const coloredSource = `${Logger.SOURCE_COLOR}${this.source}${Logger.RESET_COLOR}`

		const logMethod = (level === 'debug' ? 'log' : level) as
			| 'log'
			| 'info'
			| 'warn'
			| 'error'
		console[logMethod](
			`${timestamp} ${coloredLevel}${coloredSource}: ${Logger.MESSAGE_COLORS[level]}${message}${Logger.RESET_COLOR}`,
			...args,
		)
	}

	private shouldLog(level: LogLevel): boolean {
		if (this.logLevel === 'off') return false
		return (
			Logger.LEVELS.indexOf(level) >= Logger.LEVELS.indexOf(this.logLevel)
		)
	}

	private formatTimestamp(): string {
		const date = new Date()
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		const hours = String(date.getHours()).padStart(2, '0')
		const minutes = String(date.getMinutes()).padStart(2, '0')
		const seconds = String(date.getSeconds()).padStart(2, '0')
		const amOrPm = date.getHours() >= 12 ? 'PM' : 'AM'

		return `${Logger.TIMESTAMP_COLOR}[ ${day}/${month}/${year} ${hours}:${minutes}:${seconds} ${amOrPm} ]${Logger.RESET_COLOR}`
	}
	public testAllTypes(): void {
		this.debug('Debug message')
		this.info('Info message')
		this.warn('Warning message')
		this.error('Error message')
	}
}
