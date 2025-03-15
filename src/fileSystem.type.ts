/*
  Copyright 2025 Abdellah Allali
*/

export interface DeleteOptions {
	recursive?: boolean
	force?: boolean
	silent?: boolean
}

export interface MkdirOptions {
	silent?: boolean
}

export interface CopyOptions {
	recursive?: boolean
	force?: boolean
	overwrite?: boolean
	silent?: boolean
}

export interface MoveOptions {
	force?: boolean
	overwrite?: boolean
	silent?: boolean
}

type BufferEncoding =
	| 'ascii'
	| 'utf8'
	| 'utf-8'
	| 'utf16le'
	| 'utf-16le'
	| 'ucs2'
	| 'ucs-2'
	| 'base64'
	| 'base64url'
	| 'latin1'
	| 'binary'
	| 'hex'

export interface ReadFileOptions {
	encoding?: BufferEncoding
	flag?: string
}
