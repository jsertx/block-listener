import Joi from "joi";
import { SetOptional } from "type-fest";

import { validateOrThrowError } from "../Utils/Validation";
import { HexAddressStr } from "../Values/Address";
import {
  Blockchain,
  BlockchainId,
  blockchainIdList,
} from "../Values/Blockchain";
import { WalletTag, walletTagNameList } from "../Values/WalletTag";
import { WalletType, walletTypeList } from "../Values/WalletType";
import { Entity } from "./Base/Entity";

interface WalletProps {
  blockchain: BlockchainId;
  address: HexAddressStr;
  alias?: string;

  type: WalletType;
  tags: WalletTag[];
  relations: AddressRelation[];
  createdAt: Date;
}
type WalletPropsConstructor = SetOptional<WalletProps, "relations" | "tags">;

export interface WalletRaw extends WalletProps {}

enum AddressRelationType {
  TransferedAsset = "transfer.sent",
  ReceivedAsset = "transfer.received",
}

export const addressRelationTypeList = Object.values(AddressRelationType);

export interface AddressRelation {
  address: string;
  type: AddressRelationType;
  createdAt: Date;
  metadata: {
    txHash?: string;
  };
}

export const WalletRelationSchema = Joi.object({
  address: Joi.string().required(),
  type: Joi.string()
    .valid(...addressRelationTypeList)
    .required(),
  metadata: Joi.object({
    txHash: Joi.string().optional(),
  }).optional(),
});

export const WalletAddressTagSchema = Joi.object({
  tag: Joi.string().valid(...walletTagNameList),
});

export const WalletSchema = Joi.object({
  blockchain: Joi.string()
    .valid(...blockchainIdList)
    .required(),
  address: Joi.string().required(),
  type: Joi.string()
    .valid(...walletTypeList)
    .required(),
  relations: Joi.array().items(WalletRelationSchema).optional(),
  alias: Joi.string().optional(),
  tags: Joi.array().items(WalletAddressTagSchema).optional(),
  createdAt: Joi.date().required(),
}).options({ stripUnknown: true });

export class Wallet extends Entity<WalletProps> {
  constructor(props: WalletPropsConstructor, _id?: string) {
    super({ relations: [], tags: [], ...props }, _id);
  }
  addRelation(addressRelation: AddressRelation) {
    this.props.relations.push(addressRelation);
  }

  get type(): WalletType {
    return this.props.type;
  }

  get address(): HexAddressStr {
    return this.props.address;
  }

  get blockchain(): Blockchain {
    return new Blockchain(this.props.blockchain);
  }

  static create(props: WalletRaw, _id?: string): Wallet {
    validateOrThrowError(props, WalletSchema);
    return new Wallet(props, _id);
  }
}
