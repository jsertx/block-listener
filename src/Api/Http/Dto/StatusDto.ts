import { BlockchainId } from "../../../Config/Blockchains";

export interface StatusResponseDto {
	latestBlocks: Partial<
		Record<BlockchainId, { height: number; link: string }>
	>;
	counter: {
		wallets: {
			whales: number;
			unknown: number;
			total: number;
		};
		txs: {
			dexSwaps: number;
			ethTransfers: number;
			unknown: number;
			total: number;
		};
		tokens: number;
	};
}
