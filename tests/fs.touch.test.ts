import tmp from 'tmp'
import { FileSystem } from '../src/fileSystem'

describe('FileSystem - TOUCH command', () => {
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

	test('should create a new file in the current directory', () => {
		fs.touch('new-file.txt', 'Sample content')
		expect(fs.ls()).toContain('new-file.txt')
	})

	test('should throw an error if the file already exists', () => {
		expect(() => {
			fs.touch('existing-file.txt')
			fs.touch('existing-file.txt')
		}).toThrow("touch: cannot create file 'existing-file.txt': File exists")
	})

	test('should create an empty file when no content is provided', () => {
		fs.touch('empty-file.txt')
		expect(fs.ls()).toContain('empty-file.txt')
	})
})
