import { FileSystem } from '../src/fileSystem'

describe('FileSystem - PWD command', () => {
	let fs: FileSystem

	beforeEach(() => {
		fs = new FileSystem()
	})

	test('should return current directory', () => {
		expect(typeof fs.pwd()).toBe('string')
		expect(typeof process.cwd()).toBe('string')
		expect(fs.pwd()).toBe(process.cwd())
	})
})
