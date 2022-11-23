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
/**
 * MaxRetries should be a consumer executor as the message does not
 * need to know needs of the consumer
 */
export class TxDiscovered extends ExecutorMessage<TxDiscoveredPayload> {
	constructor(payload: TxDiscoveredPayload) {
		super(Publication.TxDiscovered(payload.blockchain), payload, {
			maxRetries: 30
		});
	}
}
