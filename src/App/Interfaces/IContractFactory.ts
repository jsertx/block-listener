import { ethers } from "ethers";
import { Contract } from "../../Domain/Entities/Contract";

export interface IContractFactory {
  getContract(
    address: Contract,
    provider?: ethers.providers.BaseProvider
  ): ethers.Contract;
}
