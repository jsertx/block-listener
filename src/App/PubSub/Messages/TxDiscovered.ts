import { BlockchainId } from "../../Values/Blockchain";
import { Publication } from "../../../Infrastructure/Broker/Publication";
import { BaseMessage } from "../../../Infrastructure/Broker/BaseMessage";
import { ethers } from "ethers";

export interface TxDiscoveredPayload {
	blockchain: BlockchainId;
	hash: string;
	txRes?: ethers.providers.TransactionResponse;
}

export class TxDiscovered extends BaseMessage<TxDiscoveredPayload> {
	constructor(blockchain: BlockchainId, payload: TxDiscoveredPayload) {
		super(Publication.TxDiscovered(blockchain), payload);
	}
}
