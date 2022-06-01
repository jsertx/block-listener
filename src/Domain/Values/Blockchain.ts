export enum BlockchainId {
  Ethereum = "ethereum",
}

export const blockchainIdList = Object.values(BlockchainId);

const blockchainToChainId: Record<BlockchainId, number> = {
  [BlockchainId.Ethereum]: 1,
};

export class Blockchain {
  constructor(public id: BlockchainId) {}

  get chainId(): number {
    return Blockchain.toChainId(this.id);
  }

  static toChainId(id: BlockchainId): number {
    if (!blockchainToChainId[id]) {
      throw new Error(`Blockchain ${id} invalid or unsupported`);
    }
    return blockchainToChainId[id];
  }
}
