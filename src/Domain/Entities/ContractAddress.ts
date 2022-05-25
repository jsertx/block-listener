import { ABI } from "../../App/Services/SmartContract/ABI";
import { ContractType } from "../Values/ContractType";
import { Address, AddressRaw } from "./Address";

interface ContractAddressDataRaw {
  type: ContractType;
  customAbi?: any;
}

const contractTypeToAbi = {
  [ContractType.TokenErc20]: ABI.ERC20,
  [ContractType.UniswapRouterV2Like]: ABI.UniswapRouter02,
  [ContractType.ArbBot]: undefined,
  [ContractType.MevBot]: undefined,
};

export interface ContractAddressRaw
  extends AddressRaw<ContractAddressDataRaw> {}

export class ContractAddress extends Address<ContractAddressDataRaw> {
  get contractType(): ContractType {
    return this.props.data.type;
  }

  get abi(): any {
    return this.props.data.customAbi || contractTypeToAbi[this.contractType];
  }
}
