import { WalletSchema } from "../Schemas/AddressSchema";
import { validateOrThrowError } from "../Utils/Validation";
import { HexAddress } from "../Values/Address";
import { Blockchain, BlockchainId } from "../Values/Blockchain";
import { WalletTag } from "../Values/WalletTag";
import { WalletType } from "../Values/WalletType";
import { Entity } from "./Base/Entity";

interface WalletProps {
  blockchain: BlockchainId;
  address: HexAddress;
  alias?: string;

  type: WalletType;
  tags: WalletTag[];
  relations: AddressRelation[];
  createdAt: Date;
}

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

export class Wallet extends Entity<WalletProps> {
  constructor(props: WalletProps, _id?: string) {
    super(props, _id);
  }
  addRelation(addressRelation: AddressRelation) {
    this.props.relations.push(addressRelation);
  }
  get address(): HexAddress {
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
