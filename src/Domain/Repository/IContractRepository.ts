import { Address } from "../Entities/Base/Address";
import { Contract } from "../Entities/Contract";
import { BlockchainId } from "../Values/Blockchain";
import { IBaseRepository } from "./IBaseRepository";

export interface IContractRepository extends IBaseRepository<Contract> {
  findContract(
    address: string,
    blockchain: BlockchainId
  ): Promise<Contract | null>;
}
