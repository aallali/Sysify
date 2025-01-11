import tmp from 'tmp'
import { FileSystem } from '../src/fileSystem'

describe('FileSystem - MKDIR command', () => {
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

	test('should create a new directory in the current directory', () => {
		fs.mkdir('new-dir')
		expect(fs.ls()).toContain('new-dir/')
	})

	test('should throw an error if the directory already exists', () => {
		fs.mkdir('existing-dir')
		expect(() => {
			fs.mkdir('existing-dir')
		}).toThrow("mkdir: cannot create directory 'existing-dir': File exists")
	})

	test('should allow creating multiple directories', () => {
		fs.mkdir('dir1')
		fs.mkdir('dir2')
		expect(fs.ls()).toEqual(expect.arrayContaining(['dir1/', 'dir2/']))
	})
})
