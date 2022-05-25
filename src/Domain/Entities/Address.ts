import { HexAddress } from "../Values/Address";
import { AddressType } from "../Values/AddressType";
import { Blockchain, BlockchainId } from "../Values/Blockchain";
import { Entity } from "./Entity";

enum AddressRelationType {
  TransferedAsset = "transfer.sent",
  ReceivedAsset = "transfer.received",
}

interface AddressRelation {
  address: string;
  type: AddressRelationType;
  createdAt: Date;
  metadata: {
    txHash?: string;
  };
}

export interface AddressRaw<DataType = any> {
  blockchain: BlockchainId;
  address: HexAddress;
  type: AddressType;
  relations: AddressRelation[];
  // just a descriptive name: like "Elon Musk DOGE Bag", "USDT treasury", "Coinbase 4",
  alias?: string;
  data: DataType;
  createdAt: Date;
}

export class Address<DataType = any> extends Entity<AddressRaw<DataType>> {
  protected _blockchain: Blockchain;
  constructor(props: AddressRaw<DataType>, _id?: string) {
    super(props, _id);
    this._blockchain = new Blockchain(props.blockchain);
  }

  get address(): HexAddress {
    return this.props.address;
  }

  get type(): AddressType {
    return this.props.type;
  }

  get blockchain(): Blockchain {
    return this._blockchain;
  }

  get data(): DataType {
    return this.props.data;
  }
}
