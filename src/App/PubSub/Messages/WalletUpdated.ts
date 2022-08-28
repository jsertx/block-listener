import { BlockchainId } from "../../Values/Blockchain";
import { Publication } from "../../../Infrastructure/Broker/Publication";
import { BaseMessage } from "../../../Infrastructure/Broker/BaseMessage";

export interface WalletUpdatedPayload {
	blockchain: BlockchainId;
	address: string;
}

export class WalletUpdated extends BaseMessage<WalletUpdatedPayload> {
	constructor(payload: WalletUpdatedPayload) {
		super(Publication.WalletUpdated(payload.blockchain), payload);
	}
}
