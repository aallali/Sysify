/*
  Copyright 2025 Abdellah Allali
*/

import type { LogLevel } from './logger'

/** Error-handling options accepted by every command. */
export interface CommandOptions {
	/** Do not log the error (default: `false`). */
	silent?: boolean
	/** Do not throw; return a fallback value instead (default: `false`). */
	force?: boolean
}

export interface MkdirOptions extends CommandOptions {
	/** Create parent directories as needed; no error if it already exists (like `mkdir -p`). */
	recursive?: boolean
}

export interface DeleteOptions extends CommandOptions {
	/** Required to delete a directory and its contents (like `rm -r`). */
	recursive?: boolean
}

export interface CopyOptions extends CommandOptions {
	/** Required to copy a directory and its contents (like `cp -r`). */
	recursive?: boolean
	/** Replace the destination if it exists. */
	overwrite?: boolean
}

export interface MoveOptions extends CommandOptions {
	/** Replace the destination if it exists. */
	overwrite?: boolean
}

export interface WriteFileOptions extends CommandOptions {
	/** Append to the file instead of replacing its content. */
	append?: boolean
	/** Write to a temp file then rename it, so readers never see a partial file. Can't be combined with `append`. */
	atomic?: boolean
	/** Encoding used when `data` is a string (default: `'utf8'`). */
	encoding?: BufferEncoding
}

export interface ReadFileOptions extends CommandOptions {
	/** When set, the content is returned as a string instead of a `Buffer`. */
	encoding?: BufferEncoding
	/** File system flag (default: `'r'`). */
	flag?: string
}

export interface WriteJsonOptions extends CommandOptions {
	/** Indentation passed to `JSON.stringify` (default: `2`). */
	spaces?: number | string
	/** See {@link WriteFileOptions.atomic}. */
	atomic?: boolean
}

export interface LsOptions extends CommandOptions {
	/** List subdirectories too; entries are paths relative to the listed directory. */
	recursive?: boolean
}

export interface FileSystemOptions extends CommandOptions {
	/**
	 * Sandbox directory: the working directory starts here and any path that
	 * resolves outside it fails with `EACCES`.
	 */
	root?: string
	/** Logger level (default: `LOG_LEVEL` env variable, then `'warn'`). */
	logLevel?: LogLevel
}
