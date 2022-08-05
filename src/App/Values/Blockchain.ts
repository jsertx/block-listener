import { BlockchainId } from "../../Config/Blockchains";
import { NotEvmChainError } from "../Errors/NotEvmChainError";

export { BlockchainId } from "../../Config/Blockchains";
export const blockchainIdList = Object.values(BlockchainId);

const blockchainToChainId: Record<BlockchainId, number> = {
	[BlockchainId.Ethereum]: 1,
	[BlockchainId.Binance]: 56,
	[BlockchainId.Polygon]: 137
};

const blockchainToTokenSymbol: Record<BlockchainId, string> = {
	[BlockchainId.Ethereum]: "ETH",
	[BlockchainId.Binance]: "BNB",
	[BlockchainId.Polygon]: "MATIC"
};

export class Blockchain {
	constructor(public id: BlockchainId) {
		if (!Object.values(BlockchainId).find((bid) => bid === id)) {
			throw new Error(`Invalid blockchain id "${id}"`);
		}
	}

	get chainId(): number {
		return Blockchain.toChainId(this.id);
	}
	get nativeTokenSymbol(): string {
		return blockchainToTokenSymbol[this.id];
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
