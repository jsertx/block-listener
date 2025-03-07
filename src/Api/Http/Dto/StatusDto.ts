import { BlockchainId } from "../../../Config/Blockchains";

export interface IQueueStatus {
	processing: number;
	retrying: number;
	dead: number;
}
export interface StatusResponseDto {
	v: string;
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
	broker: Record<string, IQueueStatus>;
}
