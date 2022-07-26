import { NotEvmChainError } from "../Errors/NotEvmChainError";

export enum BlockchainId {
  Ethereum = "ethereum",
  Bitcoin = "bitcoin",
  Binance = "binance",
  Polygon = "polygon",
}

export const blockchainIdList = Object.values(BlockchainId);

const blockchainToChainId: Partial<Record<BlockchainId, number>> = {
  [BlockchainId.Bitcoin]: undefined,
  [BlockchainId.Ethereum]: 1,
  [BlockchainId.Binance]: 56,
  [BlockchainId.Polygon]: 137,
};

export class Blockchain {
  constructor(public id: BlockchainId) {}

  get chainId(): number {
    return Blockchain.toChainId(this.id);
  }

  static toChainId(id: BlockchainId): number {
    const chainId = blockchainToChainId[id];
    if (chainId === undefined) {
      throw new NotEvmChainError(id);
    }
    if (!chainId) {
      throw new Error(`Blockchain ${id} invalid or unsupported`);
    }

    return chainId;
  }

  equals(blockchain: Blockchain | BlockchainId): boolean {
    if (blockchain instanceof Blockchain) {
      return this.equals(blockchain.id);
    }
    return this.id === blockchain;
  }
}
