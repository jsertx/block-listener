import Joi from "joi";
import { BlockchainId, blockchainIdList } from "../../../App/Values/Blockchain";
import {
  ContractType,
  contractTypeList,
} from "../../../App/Values/ContractType";

export interface CreateContractDto {
  address: string;
  blockchain: BlockchainId;
  type: ContractType;
  alias: string;
  customAbi?: any;
}

export const CreateContractDtoSchema = Joi.object({
  address: Joi.string().required(),
  blockchain: Joi.string()
    .valid(...blockchainIdList)
    .required(),
  type: Joi.string()
    .valid(...contractTypeList)
    .required(),
  alias: Joi.string().optional(),
});
