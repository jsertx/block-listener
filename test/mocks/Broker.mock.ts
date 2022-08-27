import { mock, MockProxy } from "jest-mock-extended";
import { IBroker } from "../../src/Interfaces/IBroker";

export const createBrokerMock = (): MockProxy<IBroker> => {
	return mock<IBroker>();
};
