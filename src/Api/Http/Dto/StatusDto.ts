import { BlockchainId } from "../../../Config/Blockchains";

export interface StatusResponseDto {
	latestBlocks: Partial<Record<BlockchainId, number>>;
	counter: {
		wallets: number;
		txs: {
			dexSwaps: number;
			ethTransfers: number;
			unknown: number;
		};
		tokens: number;
	};
}
