import Joi from "joi";
import { BlockchainId, blockchainIdList } from "../../../App/Values/Blockchain";
import { WalletType, walletTypeList } from "../../../App/Values/WalletType";

export interface CreateWalletDto {
  address: string;
  blockchain: BlockchainId;
  type: WalletType;
  alias: string;
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
}).options({ stripUnknown: true });
