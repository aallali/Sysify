/* ************************************************************************** */
/*   Copyright 2025 <Sysify>                                                  */
/*                                                                            */
/*   File    : fs.delete.test.ts                                              */
/*   Project : Sysify                                                         */
/*   License : MIT                                                            */
/*                                                                            */
/*   Created: 2025/01/13 16:15:06 by aallali                                  */
/*   Updated: 2025/01/13 22:34:43 by aallali                                  */
/* ************************************************************************** */

import tmp from 'tmp'
import { FileSystem } from '../src/fileSystem'

export type DeleteOptions = {
	recursive?: boolean
	force?: boolean
	silent?: boolean
}

describe('FileSystem - DELETE command', () => {
	let fs: FileSystem
	let tempDir: tmp.DirResult

	beforeEach(() => {
		tempDir = tmp.dirSync({ unsafeCleanup: true })
		fs = new FileSystem()
		fs.cd(tempDir.name)
	})

	afterEach(() => {
		tempDir.removeCallback() // Automatically deletes temp directory
	})

	test('should delete a file in the current directory', () => {
		const fileName = 'file-to-delete.txt'
		fs.touch(fileName, 'Temporary content')
		expect(fs.ls()).toContain(fileName)

		fs.delete(fileName)
		expect(fs.ls()).not.toContain(fileName)
	})

	test('should delete a non-empty directory recursively', () => {
		const dirName = 'non-empty-dir'
		fs.mkdir(dirName)
		fs.cd(dirName)
		fs.touch('file1.txt', 'Content 1')
		fs.touch('file2.txt', 'Content 2')
		fs.cd('..')

		expect(fs.ls()).toContain(`${dirName}/`)

		fs.delete(dirName, { recursive: true })
		expect(fs.ls()).not.toContain(`${dirName}/`)
	})

	test('should throw an error if attempting to delete a non-empty directory without recursive option', () => {
		const dirName = 'non-empty-dir'
		fs.mkdir(dirName)
		fs.cd(dirName)
		fs.touch('file.txt', 'Content')
		fs.cd('..')

		expect(() => {
			fs.delete(dirName)
		}).toThrow(
			`delete: '${dirName}' is a directory (use recursive option to delete)`,
		)
	})

	test('should handle non-existent paths with force option', () => {
		const nonExistentPath = 'non-existent-file.txt'

		expect(() => {
			fs.delete(nonExistentPath)
		}).toThrow(
			`delete: cannot delete '${nonExistentPath}': No such file or directory`,
		)

		expect(() => {
			fs.delete(nonExistentPath, { force: true })
		}).not.toThrow()
	})

	test('should suppress errors and logs in silent mode', () => {
		const nonExistentPath = 'non-existent-file.txt'

		expect(() => {
			fs.delete(nonExistentPath, { silent: true, force: true })
		}).not.toThrow()
	})
})
