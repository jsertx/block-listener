import Joi from "joi";
import {
  AddressRelation,
  WalletAddressTagSchema,
  WalletRelationSchema,
} from "../../../App/Entities/Wallet";
import { BlockchainId, blockchainIdList } from "../../../App/Values/Blockchain";
import { WalletTag } from "../../../App/Values/WalletTag";
import { WalletType, walletTypeList } from "../../../App/Values/WalletType";

export interface CreateWalletDto {
  address: string;
  blockchain: BlockchainId;
  type: WalletType;
  alias: string;

  tags: WalletTag[];
  relations: AddressRelation[];
  createdAt: Date;
}

export const CreateWalletDtoSchema = Joi.object({
  address: Joi.string().required(),
  blockchain: Joi.string()
    .valid(...blockchainIdList)
    .required(),
  type: Joi.string()
    .valid(...walletTypeList)
    .required(),
  alias: Joi.string().optional(),
  relations: Joi.array().items(WalletRelationSchema).optional(),
  tags: Joi.array().items(WalletAddressTagSchema).optional(),
});
