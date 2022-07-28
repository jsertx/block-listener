import { ABI } from "../Services/SmartContract/ABI";
import { validateOrThrowError } from "../Utils/Validation";
import { ContractType, contractTypeList } from "../Values/ContractType";
import { Entity } from "./Base/Entity";
import { HexAddressStr } from "../Values/Address";
import {
  Blockchain,
  BlockchainId,
  blockchainIdList,
} from "../Values/Blockchain";
import Joi from "joi";
import { Dex } from "../Values/Dex";

export interface PairData {
  tokenA: string;
  tokenB: string;
  dex: Dex;
}

export interface FactoryData {
  dex: Dex;
  initCodeHash: string;
}

export interface ContractIdProps {
  blockchain: BlockchainId;
  address: HexAddressStr;
}
export interface ContractProps<DataProps> extends ContractIdProps {
  alias?: string;
  data?: DataProps;
  createdAt: Date;
  type: ContractType;
  customAbi?: any;
}

const contractTypeToAbi = {
  [ContractType.TokenErc20]: ABI.ERC20,
  [ContractType.UniswapRouterV2Like]: ABI.UniswapRouter02,
  [ContractType.UniswapPairV2Like]: ABI.UniswapPair,
  [ContractType.UniswapFactoryV2Like]: ABI.UniswapFactory,
};

export interface ContractRaw<DataRaw = any> extends ContractProps<DataRaw> {}

export const ContractSchema = Joi.object({
  blockchain: Joi.string()
    .valid(...blockchainIdList)
    .required(),
  address: Joi.string().required(),
  type: Joi.string()
    .valid(...contractTypeList)
    .required(),
  alias: Joi.string().optional(),
  data: Joi.any().optional(),
  createdAt: Joi.date().required(),
  customAbi: Joi.any(),
}).options({ stripUnknown: true });

export class Contract<DataTypeRaw = any> extends Entity<
  ContractProps<DataTypeRaw>
> {
  get address(): HexAddressStr {
    return this.props.address;
  }

  get blockchain(): Blockchain {
    return new Blockchain(this.props.blockchain);
  }
  get data(): DataTypeRaw | undefined {
    return this.props.data;
  }
  get type(): ContractType {
    return this.props.type;
  }

  get abi(): any {
    return this.props.customAbi || contractTypeToAbi[this.type];
  }

  static create(props: ContractRaw<any>, _id?: string): Contract {
    validateOrThrowError(props, ContractSchema);
    return new Contract(props, _id);
  }
}
