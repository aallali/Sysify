/*
    Copyright 2025 Abdellah Allali
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
		super(options.message)
		this.name = 'FileSystemError'
		this.code = options.code
		this.operation = options.operation
		this.path = options.path
		this.originalError = options.originalError
	}
}
