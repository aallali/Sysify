/*
    Copyright 2025 Abdellah Allali
*/

/**
 * Error thrown by every `FileSystem` command.
 *
 * `message` is formatted as `<operation>: <details>`.
 * `code` follows Node's errno names (`ENOENT`, `EEXIST`, `EISDIR`, `ENOTDIR`,
 * `EACCES`, `EINVAL`, `ENOTSUP`, ...) so you can branch on it instead of the message.
 */
export class FileSystemError extends Error {
	public readonly code?: string
	public readonly operation: string
	public readonly path?: string
	public readonly originalError?: Error

	constructor(options: {
		message: string
		operation: string
		code?: string
		path?: string
		originalError?: Error
	}) {
		super(`${options.operation}: ${options.message}`)
		this.name = 'FileSystemError'
		this.code = options.code
		this.operation = options.operation
		this.path = options.path
		this.originalError = options.originalError
	}
}
