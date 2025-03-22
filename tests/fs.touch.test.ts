/*
	Copyright 2025 Abdellah Allali
*/

import nodeFS from 'node:fs'
import tmp from 'tmp'
import { FileSystem } from '../src/fileSystem'

describe('FileSystem - TOUCH command with Buffer support', () => {
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

	test('should create a new file with UTF-8 string content and verify content', () => {
		const fileName = 'utf8-file.txt'
		const content = 'Sample UTF-8 content'
		const filePath = `${tempDir.name}/${fileName}`

		fs.touch(fileName, content)

		expect(fs.ls()).toContain(fileName)
		expect(fs.readFile(filePath, { encoding: 'utf-8' })).toBe(content)
	})

	test('should create a new file with binary data (Buffer) and verify content', () => {
		const fileName = 'binary-file.bin'
		const binaryData = Buffer.from([0x42, 0x69, 0x6e, 0x61, 0x72, 0x79]) // "Binary"
		const filePath = `${tempDir.name}/${fileName}`

		fs.touch(fileName, binaryData)

		expect(fs.ls()).toContain(fileName)
		expect(nodeFS.readFileSync(filePath)).toEqual(binaryData)
	})

	test('should create a new file with Arabic text (Buffer input) and verify content', () => {
		const fileName = 'arabic-file.txt'
		const arabicText = Buffer.from('السلام عليكم', 'utf-8')
		const filePath = `${tempDir.name}/${fileName}`

		fs.touch(fileName, arabicText)

		expect(fs.ls()).toContain(fileName)
		expect(fs.readFile(filePath, { encoding: 'utf-8' })).toBe(
			'السلام عليكم',
		)
	})

	test('should create a new file with Arabic plain text and verify content', () => {
		const fileName = 'arabic-plain.txt'
		const content = 'السلام عليكم'
		const filePath = `${tempDir.name}/${fileName}`

		fs.touch(fileName, content)

		expect(fs.ls()).toContain(fileName)
		expect(fs.readFile(filePath, { encoding: 'utf-8' })).toBe(content)
	})

	test('should throw an error if the file already exists (Buffer input)', () => {
		const fileName = 'duplicate-file.txt'
		const bufferData = Buffer.from('Duplicate test')

		fs.touch(fileName, bufferData)

		expect(() => {
			fs.touch(fileName, bufferData)
		}).toThrow(`touch: cannot create file '${fileName}': File exists`)
	})

	test('should create an empty file when no content is provided and verify it is empty', () => {
		const fileName = 'empty-file.txt'
		const filePath = `${tempDir.name}/${fileName}`

		fs.touch(fileName)

		expect(fs.ls()).toContain(fileName)		
		expect(fs.readFile(filePath, { encoding: 'utf-8' })).toBe('')
	})
})
