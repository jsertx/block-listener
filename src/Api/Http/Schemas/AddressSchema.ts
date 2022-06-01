import Joi from "joi";
import { addressRelationTypeList } from "../../../Domain/Entities/Base/Address";
import {
  AddressType,
  addressTypeList,
} from "../../../Domain/Values/AddressType";
import { blockchainIdList } from "../../../Domain/Values/Blockchain";
import { contractTypeList } from "../../../Domain/Values/ContractType";
import { walletTagNameList } from "../../../Domain/Values/WalletTag";
import { walletTypeList } from "../../../Domain/Values/WalletType";

export const AddressRelationSchema = Joi.object({
  address: Joi.string().required(),
  type: Joi.string()
    .valid(...addressRelationTypeList)
    .required(),
  metadata: Joi.object({
    txHash: Joi.string().optional(),
  }).optional(),
});

const ContractAddressSchema = Joi.object({
  type: Joi.string()
    .valid(...contractTypeList)
    .required(),
  customAbi: Joi.any(),
});

const WalletAddressTagSchema = Joi.object({
  tag: Joi.string().valid(...walletTagNameList),
});

const WalletAddressSchema = Joi.object({
  type: Joi.string()
    .valid(...walletTypeList)
    .required(),
  tags: Joi.array().items(WalletAddressTagSchema).optional(),
});

export const AddressSchemaPartial = {
  blockchain: Joi.string()
    .valid(...blockchainIdList)
    .required(),
  address: Joi.string().required(),
  type: Joi.string()
    .valid(...addressTypeList)
    .required(),
  relations: Joi.array().items(AddressRelationSchema).optional(),
  alias: Joi.string().optional(),
  data: Joi.alternatives().conditional("type", {
    is: AddressType.Contract,
    then: ContractAddressSchema,
    otherwise: WalletAddressSchema,
  }),
};

export const WalletSchema = Joi.object({
  ...AddressSchemaPartial,
  type: Joi.string().valid(AddressType.Wallet).required(),
  data: WalletAddressSchema,
});

export const ContractSchema = Joi.object({
  ...AddressSchemaPartial,
  type: Joi.string().valid(AddressType.Contract).required(),
  data: ContractAddressSchema,
});
