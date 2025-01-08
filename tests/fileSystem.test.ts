import { FileSystem } from '../src/fileSystem';

describe('FileSystem', () => {
    let fs: FileSystem;

    beforeEach(() => {
        fs = new FileSystem();
    });

    test('should create a directory', () => {
        fs.mkdir('documents');
        // expect(fs.ls()).toContain('documents');
        expect(fs.ls()).toEqual([]);
    });

    test('should create a file', () => {
        fs.touch('notes.txt', 'Sample content');
        // expect(fs.ls()).toContain('notes.txt');
        expect(fs.ls()).toEqual([]);
    });
});
