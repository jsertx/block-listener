import { BlockchainId } from "../../Values/Blockchain";

import { ExecutorMessage } from "../../../Infrastructure/Broker/Executor";
import { Publication } from "../../../Infrastructure/Broker/Rabbitmq/Enums";

export interface TokenDiscoveredPayload {
	blockchain: BlockchainId;
	address: string;
}

export class TokenDiscovered extends ExecutorMessage<TokenDiscoveredPayload> {
	constructor(payload: TokenDiscoveredPayload) {
		super(Publication.TokenDiscovered, payload);
	}
}
