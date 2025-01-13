import { FileSystem } from "sysify";

const fs = new FileSystem();
const { log } = console;

try {
    // Demonstrate file system operations
    log("Initial directory contents:", fs.ls()); // Should be empty initially
    log("Current directory:", fs.pwd()); // Should print the root path

    // Create a new directory
    fs.mkdir("test-dir");
    fs.mkdir("test-dir");

    log("After creating 'test-dir':", fs.ls());

    // Change into the new directory
    fs.cd("test-dir");
    log("Current directory after cd:", fs.pwd());

    // Create a new file
    fs.touch("example.txt", "Hello, Sysify!");
    log("Contents of 'test-dir':", fs.ls());

    // Create another file with binary content
    const binaryData = Buffer.from("Binary data");
    fs.touch("binary.bin", binaryData);
    log("Contents after adding binary file:", fs.ls());
} catch (error) {
    log("Error:", error.message);
}
