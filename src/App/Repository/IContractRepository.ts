import { Contract, ContractIdProps, ContractRaw } from "../Entities/Contract";
import { BlockchainId } from "../Values/Blockchain";
import { Dex } from "../Values/Dex";
import { IBaseRepository } from "./IBaseRepository";

export interface IContractRepository
	extends IBaseRepository<Contract, ContractIdProps> {
	findContract(
		address: string,
		blockchain: BlockchainId
	): Promise<Contract | null>;

	findContractsBy(filters: Partial<ContractRaw>): Promise<Contract[]>;

	countDexPairs({
		dex,
		blockchain
	}: {
		dex: Dex;
		blockchain: BlockchainId;
	}): Promise<number>;
}
