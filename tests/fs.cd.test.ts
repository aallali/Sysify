import { FileSystem } from '../src/fileSystem'

describe('FileSystem - CD command', () => {
	let fs: FileSystem

	beforeEach(() => {
		fs = new FileSystem()
	})

	test('should cd a given directory', () => {
		fs.cd('src/')
		expect(fs.pwd()).toBe(process.cwd() + '/src')
	})

	test('should throw error given invalid directory path', () => {
		const invalidDir = 'non-existent-dir'
		expect(() => fs.cd(invalidDir)).toThrow(
			`cd: no such file or directory: ${invalidDir}`,
		)
	})

	test('should "cd" to parent directory', () => {
		fs.cd('src/')
		expect(fs.pwd()).toBe(process.cwd() + '/src')
		fs.cd('../')
		expect(fs.pwd()).toBe(process.cwd())
	})

	test('should cd to the root directory', () => {
		fs.cd('/')
		expect(fs.pwd()).toBe('/')
	})

	test('should handle chained relative paths', () => {
		fs.cd('src/')
		fs.cd('./../src/')
		expect(fs.pwd()).toBe(process.cwd() + '/src')
	})

	test('should not navigate beyond root directory', () => {
		fs.cd('/')
		fs.cd('../')
		expect(fs.pwd()).toBe('/')
	})

	test('should normalize paths correctly', () => {
		fs.cd('src/./../src/')
		expect(fs.pwd()).toBe(process.cwd() + '/src')
	})

	test('should allow case sensitivity of paths', () => {
		const lowerCasePath = 'src/'
		const upperCasePath = '../SRC/'
		fs.cd(lowerCasePath)
		expect(fs.pwd()).toBe(process.cwd() + '/src')
		fs.cd(upperCasePath)
		expect(fs.pwd()).toBe(process.cwd() + '/src')
	})

	test('should throw error for invalid characters in path', () => {
		const invalidPath = 'src/invalid|path'
		expect(() => fs.cd(invalidPath)).toThrow(
			`cd: no such file or directory: ${invalidPath}`,
		)
	})
})
