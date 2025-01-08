/* ************************************************************************** */
/*   Copyright 2025 <Sysify>                                                  */
/*                                                                            */
/*   File    : logger.ts                                                      */
/*   Project : Sysify                                                         */
/*   License : MIT                                                            */
/*                                                                            */
/*   Created: 2025/01/07 13:37:00 by aallali                                  */
/*   Updated: 2025/01/07 13:37:00 by aallali                                  */
/* ************************************************************************** */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
    private logLevel: LogLevel;
    private source: string;
    constructor(logLevel: LogLevel = 'info', source = '') {
        this.logLevel = logLevel;
        this.source = source ? ` [${source}]` : '';
    }

    private shouldLog(level: LogLevel): boolean {
        const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
        return levels.indexOf(level) >= levels.indexOf(this.logLevel);
    }

    private log(level: LogLevel, message: string, ...args: unknown[]): void {
        if (this.shouldLog(level)) {
            const timestamp = new Date().toISOString();
            console[level === 'debug' ? 'log' : level](
                `[${timestamp}] [${level.toUpperCase()}]${this.source}: ${message}`,
                ...args
            );
        }
    }

    info(message: string, ...args: unknown[]): void {
        this.log('info', message, ...args);
    }

    warn(message: string, ...args: unknown[]): void {
        this.log('warn', message, ...args);
    }

    error(message: string, ...args: unknown[]): void {
        this.log('error', message, ...args);
    }

    debug(message: string, ...args: unknown[]): void {
        this.log('debug', message, ...args);
    }
}

// Read log level from environment variable, default to 'info'
const logLevel = (process.env.LOG_LEVEL as LogLevel) || 'warn';

// Export a single logger instance
const logger = new Logger(logLevel, 'sysify');

export default logger;
