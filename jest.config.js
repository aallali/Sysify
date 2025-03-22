// eslint-disable-next-line no-undef
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	rootDir: '.',
	coverageDirectory: "coverage",  // Directory to save coverage reports
	coverageReporters: ["json", "lcov", "text", "clover"],
	silent: true,
	verbose: false,
	collectCoverageFrom: [
		"src/**/*.ts",
		"!src/test.ts",
		"!src/index.ts",
		"!src/logger.ts",
	],
	testMatch: ['<rootDir>/tests/**/*.test.ts'],
};
