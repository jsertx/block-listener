/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */

export default {
	preset: "ts-jest",
	testEnvironment: "node",
	setupFiles: ["./test/jest.setup.ts"]
};
