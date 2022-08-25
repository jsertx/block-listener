import { BlockchainId } from "../../Values/Blockchain";
import { Publication } from "../../../Infrastructure/Broker/Publication";
import { ethers } from "ethers";
import { ExecutorMessage } from "../../../Infrastructure/Broker/Executor";

export interface TxDiscoveredPayload {
	blockchain: BlockchainId;
	hash: string;
	saveUnknown?: boolean;
	txRes?: ethers.providers.TransactionResponse;
	block?: ethers.providers.Block;
}

export class TxDiscovered extends ExecutorMessage<TxDiscoveredPayload> {
	constructor(blockchain: BlockchainId, payload: TxDiscoveredPayload) {
		super(Publication.TxDiscovered(blockchain), payload);
	}
}
