import { BlockchainId } from "../../Values/Blockchain";
import { BaseMessage } from "../../../Infrastructure/Broker/BaseMessage";
import { Publication } from "../../../Infrastructure/Broker/Rabbitmq/Enums";

export interface WalletUpdatedPayload {
	blockchain: BlockchainId;
	address: string;
}

export class WalletUpdated extends BaseMessage<WalletUpdatedPayload> {
	constructor(payload: WalletUpdatedPayload) {
		super(Publication.WalletUpdated, payload);
	}
}
