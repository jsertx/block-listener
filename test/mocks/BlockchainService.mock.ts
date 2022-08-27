import { mock, MockProxy } from "jest-mock-extended";
import { IBlockchainService } from "../../src/App/Interfaces/IBlockchainService";

export const createBlockchainServiceMock =
	(): MockProxy<IBlockchainService> => {
		return mock<IBlockchainService>();
	};
