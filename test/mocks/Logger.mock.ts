import { mock, MockProxy } from "jest-mock-extended";
import { ILogger } from "../../src/Interfaces/ILogger";

export const createLoggerMock = (): MockProxy<ILogger> => {
	return mock<ILogger>();
};
