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
