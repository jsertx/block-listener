import { ethers } from "ethers";
import { Contract } from "../Entities/Contract";

export interface IContractFactory {
  getContract(
    address: Contract,
    provider?: ethers.providers.BaseProvider
  ): ethers.Contract;
}
