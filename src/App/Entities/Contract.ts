import { ABI } from "../Services/SmartContract/ABI";
import { validateOrThrowError } from "../Utils/Validation";
import { ContractType, contractTypeList } from "../Values/ContractType";
import { Entity } from "./Base/Entity";
import { HexAddress } from "../Values/Address";
import {
  Blockchain,
  BlockchainId,
  blockchainIdList,
} from "../Values/Blockchain";
import Joi from "joi";

interface ContractProps {
  blockchain: BlockchainId;
  address: HexAddress;
  alias?: string;
  createdAt: Date;
  type: ContractType;
  customAbi?: any;
}

const contractTypeToAbi = {
  [ContractType.TokenErc20]: ABI.ERC20,
  [ContractType.UniswapRouterV2Like]: ABI.UniswapRouter02,
  [ContractType.ArbBot]: undefined,
  [ContractType.MevBot]: undefined,
};

export interface ContractRaw extends ContractProps {}

export const ContractSchema = Joi.object({
  blockchain: Joi.string()
    .valid(...blockchainIdList)
    .required(),
  address: Joi.string().required(),
  type: Joi.string()
    .valid(...contractTypeList)
    .required(),
  alias: Joi.string().optional(),
  createdAt: Joi.date().required(),
  customAbi: Joi.any(),
}).options({ stripUnknown: true });

export class Contract extends Entity<ContractProps> {
  get address(): HexAddress {
    return this.props.address;
  }

  get blockchain(): Blockchain {
    return new Blockchain(this.props.blockchain);
  }

  get type(): ContractType {
    return this.props.type;
  }

  get abi(): any {
    return this.props.customAbi || contractTypeToAbi[this.type];
  }

  static create(props: ContractRaw, _id?: string): Contract {
    validateOrThrowError(props, ContractSchema);
    return new Contract(props, _id);
  }
}
