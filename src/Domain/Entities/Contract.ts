import { ABI } from "../../App/Services/SmartContract/ABI";
import { ContractType } from "../Values/ContractType";
import { Address, AddressRaw } from "./Base/Address";

interface ContractDataRaw {
  type: ContractType;
  customAbi?: any;
}

const contractTypeToAbi = {
  [ContractType.TokenErc20]: ABI.ERC20,
  [ContractType.UniswapRouterV2Like]: ABI.UniswapRouter02,
  [ContractType.ArbBot]: undefined,
  [ContractType.MevBot]: undefined,
};

export interface ContractRaw extends AddressRaw<ContractDataRaw> {}

export class Contract extends Address<ContractDataRaw> {
  get contractType(): ContractType {
    return this.props.data.type;
  }

  get type(): ContractType {
    return this.props.data.type;
  }

  get abi(): any {
    return this.props.data.customAbi || contractTypeToAbi[this.contractType];
  }

  static create(props: ContractRaw, _id?: string): Contract {
    return new Contract(props, _id);
  }
}
