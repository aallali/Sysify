import { FileSystem } from '../src/fileSystem'

describe('FileSystem - LS command', () => {
	let fs: FileSystem

	beforeEach(() => {
		fs = new FileSystem()
	})

	test('should return list of files in the current directory', () => {
		expect(fs.ls()).toEqual(
			expect.arrayContaining(['src/', 'tests/', 'meta.json']),
		)
	})

	test('should return list of files in the specified directory', () => {
		expect(fs.ls('src')).toEqual(
			expect.arrayContaining(['index.ts', 'fileSystem.ts']),
		)
	})

	test('should throw error given non-existent-dir to LS', () => {
		const invalidDir = 'non-existent-dir'
		expect(() => fs.ls(invalidDir)).toThrow(
			/does not exist or is not a directory\.$/i,
		)
	})

	// test for files match fs.*.test.ts inside tests/
	test('should return list of files that match the pattern', () => {
		expect(fs.ls('tests')).toEqual(
			// switch static array to regex
			expect.arrayContaining([
				expect.stringMatching(/^fs\.\w+\.test\.ts$/i),
			]),
		)
	})
})
