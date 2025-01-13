import { FileSystem } from '../src/fileSystem'
import { uuidv4 } from './helpers/generateRandomId'

describe('FileSystem - MKDIR command', () => {
	let fs: FileSystem
	let tempDir: string

	beforeEach(() => {
		tempDir = `tmp-${uuidv4()}`
		fs = new FileSystem()

		fs.mkdir(tempDir, { silent: true })
		fs.cd(tempDir)
	})

	afterEach(() => {
		fs.cd('..')
		fs.delete(tempDir, { recursive: true }) // Automatically deletes temp directory
	})

	test('should create a new directory in the current directory', () => {
		fs.mkdir('new-dir')
		expect(fs.ls()).toContain('new-dir/')
	})

	test('should throw an error if the directory already exists', () => {
		fs.mkdir('existing-dir')
		expect(() => {
			fs.mkdir('existing-dir')
		}).toThrow(
			"mkdir: cannot create directory 'existing-dir': Directory exists",
		)
	})

	test('should allow creating multiple directories', () => {
		fs.mkdir('dir1')
		fs.mkdir('dir2')
		expect(fs.ls()).toEqual(expect.arrayContaining(['dir1/', 'dir2/']))
	})
})
