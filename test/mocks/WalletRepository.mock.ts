import { IWalletRepository } from "../../src/App/Repository/IWalletRepository";
import { mock, MockProxy } from "jest-mock-extended";

export const createWalletRepositoryMock = (): MockProxy<IWalletRepository> => {
	return mock<IWalletRepository>();
};
