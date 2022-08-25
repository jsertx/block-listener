import { BlockchainId } from "../../../Config/Blockchains";

export interface StatusResponseDto {
	latestBlocks: Partial<Record<BlockchainId, number>>;
}
