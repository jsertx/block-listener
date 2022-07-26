import { HexAddress } from "../Values/Address";
import { Blockchain, BlockchainId } from "../Values/Blockchain";
import { Entity } from "./Base/Entity";

export interface TokenProps {
  address: HexAddress;
  blockchain: BlockchainId;
  symbol: string;
  name: string;
  decimals: number;
  useAsBaseForPairDiscovery: boolean;
}

export class Token extends Entity<TokenProps> {
  get blockchain(): Blockchain {
    return new Blockchain(this.props.blockchain);
  }
  get useAsBaseForPairDiscovery(): boolean {
    return this.props.useAsBaseForPairDiscovery;
  }
  get address(): string {
    return this.props.address;
  }

  get symbol(): string {
    return this.props.symbol;
  }

  get name(): string {
    return this.props.name;
  }

  get decimals(): number {
    return this.props.decimals;
  }
}
