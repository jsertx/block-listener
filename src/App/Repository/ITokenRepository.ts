import { Token } from "../Entities/Token";
import { Blockchain } from "../Values/Blockchain";
import { IBaseRepository } from "./IBaseRepository";

export type findTokensByBlockchainAddressParams = {
  blockchain: Blockchain;
  addresses: string[];
};

export interface ITokenRepository extends IBaseRepository<Token> {
  findTokensByBlockchainAddress(
    params: findTokensByBlockchainAddressParams
  ): Promise<Token[]>;
}
