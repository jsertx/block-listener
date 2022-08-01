import { BlockchainId } from "../../Values/Blockchain";
import { Publication } from "../../../Infrastructure/Broker/Publication";
import { BaseMessage } from "../../../Infrastructure/Broker/BaseMessage";

export interface TokenDiscoveredPayload {
	blockchain: BlockchainId;
	address: string;
}

export class TokenDiscovered extends BaseMessage<TokenDiscoveredPayload> {
	constructor(blockchain: BlockchainId, payload: TokenDiscoveredPayload) {
		super(Publication.TokenDiscovered(blockchain), payload);
	}
}
