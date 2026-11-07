/*
	Copyright 2025 Abdellah Allali
*/
import fs from 'node:fs'
import path from 'node:path'
import { Logger, type LogLevel } from './logger'
import { FileSystemError } from './fileSystem.error'
import type { CommandOptions, FileSystemOptions } from './fileSystem.type'

/**
 * Throws a `FileSystemError` for a failure detected by Sysify itself
 * (as opposed to one raised by Node's `fs`).
 */
export function fail(
	operation: string,
	code: string,
	message: string,
	filePath?: string,
): never {
	throw new FileSystemError({ operation, code, message, path: filePath })
}

/** State and error handling shared by the sync and async `FileSystem`. */
export abstract class FileSystemBase {
	protected currentDir: string
	protected root?: string
	protected logger: Logger
	protected defaultSilent: boolean
	protected defaultForce: boolean

	/**
	 * @param options - Global defaults applied to every command
	 * @param options.silent - Don't log errors (default: `false`)
	 * @param options.force - Don't throw errors (default: `false`)
	 * @param options.logLevel - Logger level (default: `LOG_LEVEL` env, then `'warn'`)
	 * @param options.root - Sandbox directory; paths outside it fail with `EACCES`
	 * @throws {FileSystemError} `ENOTDIR` if `root` is not an existing directory
	 */
	constructor(options: FileSystemOptions = {}) {
		this.defaultSilent = options.silent ?? false
		this.defaultForce = options.force ?? false
		this.currentDir = process.cwd()
		if (options.root !== undefined) {
			const root = path.resolve(options.root)
			if (!fs.statSync(root, { throwIfNoEntry: false })?.isDirectory()) {
				fail(
					'FileSystem',
					'ENOTDIR',
					`root is not a directory: ${root}`,
					root,
				)
			}
			this.root = this.currentDir = root
		}
		this.logger = new Logger('sysify')
		this.logger.setLevel(
			options.logLevel || (process.env.LOG_LEVEL as LogLevel) || 'warn',
		)
		this.logger.debug(`Current directory: ${this.currentDir}`)
	}

	/**
	 * Returns the logger used by this instance (e.g. to change its level).
	 */
	public getLogger(): Logger {
		return this.logger
	}

	/**
	 * Returns the current working directory (absolute path).
	 * Starts at `process.cwd()` (or `root`); only `cd` changes it.
	 */
	public pwd(): string {
		return this.currentDir
	}

	/**
	 * Resolves against {@link pwd}. With a `root`, throws `EACCES` for paths
	 * outside it (the error handler adds the operation name to the message).
	 */
	protected resolve(target: string): string {
		const resolved = path.resolve(this.currentDir, target)
		if (this.root) {
			const rel = path.relative(this.root, resolved)
			// ponytail: lexical check only; a symlink inside root can still point out (realpath if that matters)
			if (rel.startsWith('..') || path.isAbsolute(rel)) {
				throw Object.assign(
					new Error(
						`path '${target}' is outside the root '${this.root}'`,
					),
					{ code: 'EACCES' },
				)
			}
		}
		return resolved
	}

	/**
	 * Uniform error handling: wraps Node errors in `FileSystemError` (keeping
	 * their `code`), logs unless `silent`, throws unless `force` (then returns
	 * `fallback`).
	 */
	protected handle<T>(
		operation: string,
		target: string | undefined,
		options: CommandOptions,
		fallback: T,
		error: unknown,
	): T {
		// Node fs errors fail `instanceof Error` across realms (e.g. Jest)
		const err =
			error instanceof FileSystemError
				? error
				: new FileSystemError({
						operation,
						message: (error as Error)?.message ?? String(error),
						code: (error as NodeJS.ErrnoException)?.code,
						path: target,
						originalError: error as Error,
					})
		if (!(options.silent ?? this.defaultSilent)) {
			this.logger.error(err.message)
		}
		if (!(options.force ?? this.defaultForce)) throw err
		return fallback
	}
}
