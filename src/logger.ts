/* ************************************************************************** */
/*   Copyright 2025 <Sysify>                                                  */
/*                                                                            */
/*   File    : logger.ts                                                      */
/*   Project : Sysify                                                         */
/*   License : MIT                                                            */
/*                                                                            */
/*   Created: 2025/01/07 13:37:00 by aallali                                  */
/*   Updated: 2025/01/13 16:31:22 by aallali                                  */
/* ************************************************************************** */

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'off'

class Logger {
	private logLevel: LogLevel
	private source: string

	constructor(logLevel: LogLevel = 'info', source = '') {
		this.logLevel = logLevel
		this.source = source ? ` [${source}]` : ''
	}

	private shouldLog(level: LogLevel): boolean {
		if (this.logLevel === 'off') return false
		const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
		return levels.indexOf(level) >= levels.indexOf(this.logLevel)
	}

	private getColor(level: LogLevel): string {
		const colors: Record<LogLevel, string> = {
			info: '\x1b[34m', // Blue
			warn: '\x1b[33m', // Yellow
			error: '\x1b[31m', // Red
			debug: '\x1b[90m', // Gray
			off: '\x1b[37m', // White (default, unused)
		}
		return colors[level] || '\x1b[37m'
	}

	private resetColor(): string {
		return '\x1b[0m'
	}

	private log(level: LogLevel, message: string, ...args: unknown[]): void {
		if (!this.shouldLog(level)) return

		const timestamp = `\x1b[32m${new Date().toISOString()}${this.resetColor()}` // Green for timestamp
		const coloredLevel = `${this.getColor(level)}[${level.toUpperCase()}]${this.resetColor()}`
		const coloredSource = `\x1b[36m${this.source}${this.resetColor()}` // Cyan for source

		console[
			level === 'debug' ? 'log' : (level as 'info' | 'warn' | 'error')
		](`${timestamp} ${coloredLevel}${coloredSource}: ${message}`, ...args)
	}

	info(message: string, ...args: unknown[]): void {
		this.log('info', message, ...args)
	}

	warn(message: string, ...args: unknown[]): void {
		this.log('warn', message, ...args)
	}

	error(message: string, ...args: unknown[]): void {
		this.log('error', message, ...args)
	}

	debug(message: string, ...args: unknown[]): void {
		this.log('debug', message, ...args)
	}
}

// Read log level from environment variable, default to 'warn'
const logLevel = (process.env.LOG_LEVEL as LogLevel) || 'warn'

// Export a single logger instance
const logger = new Logger(logLevel, 'sysify')

export default logger
export { Logger }
