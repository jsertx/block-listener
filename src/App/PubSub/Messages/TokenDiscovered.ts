import { BlockchainId } from "../../Values/Blockchain";
import { Publication } from "../../../Infrastructure/Broker/Publication";
import { ExecutorMessage } from "../../../Infrastructure/Broker/Executor";

export interface TokenDiscoveredPayload {
	blockchain: BlockchainId;
	address: string;
}

export class TokenDiscovered extends ExecutorMessage<TokenDiscoveredPayload> {
	constructor(blockchain: BlockchainId, payload: TokenDiscoveredPayload) {
		super(Publication.TokenDiscovered(blockchain), payload);
	}
}
