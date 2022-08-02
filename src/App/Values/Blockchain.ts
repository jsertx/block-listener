import { BlockchainId } from "../../Config/Blockchains";
import { Token } from "../Entities/Token";
import { NotEvmChainError } from "../Errors/NotEvmChainError";

export { BlockchainId } from "../../Config/Blockchains";
export const blockchainIdList = Object.values(BlockchainId);

const blockchainToChainId: Record<BlockchainId, number> = {
	[BlockchainId.Ethereum]: 1,
	//[BlockchainId.Binance]: 56,
	[BlockchainId.Polygon]: 137
};

const blockchainToTokenSymbol: Record<BlockchainId, string> = {
	[BlockchainId.Ethereum]: "ETH",
	//[BlockchainId.Binance]: "BNB",
	[BlockchainId.Polygon]: "MATIC"
};

const blockchainToWrappedToken: Record<BlockchainId, Token> = {
	[BlockchainId.Ethereum]: Token.create({
		address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
		blockchain: BlockchainId.Ethereum,
		decimals: 18,
		name: "Wrapped ETH",
		symbol: "WETH",
		useAsBaseForPairDiscovery: false
	}),
	// [BlockchainId.Binance]: Token.create({
	// 	address: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
	// 	blockchain: BlockchainId.Binance,
	// 	decimals: 18,
	// 	name: "Wrapped BNB",
	// 	symbol: "WBNB",
	// 	useAsBaseForPairDiscovery: false
	// }),
	[BlockchainId.Polygon]: Token.create({
		address: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
		blockchain: BlockchainId.Polygon,
		decimals: 18,
		name: "Wrapped MATIC",
		symbol: "WMATIC",
		useAsBaseForPairDiscovery: false
	})
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
	get wrappedToken(): Token {
		return blockchainToWrappedToken[this.id];
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
