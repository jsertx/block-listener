import { ethers } from "ethers";
import { Address } from "../../Domain/Entities/Address";

export interface IContractFactory {
  getContract(
    address: Address,
    provider?: ethers.providers.BaseProvider
  ): ethers.Contract;
}
