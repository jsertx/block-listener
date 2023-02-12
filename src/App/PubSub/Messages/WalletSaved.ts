import { BlockchainId } from "../../Values/Blockchain";
import { BaseMessage } from "../../../Infrastructure/Broker/BaseMessage";
import { Publication } from "../../../Infrastructure/Broker/Rabbitmq/Enums";

export interface WalletSavedPayload {
	blockchain: BlockchainId;
	address: string;
}

export class WalletSaved extends BaseMessage<WalletSavedPayload> {
	constructor(payload: WalletSavedPayload) {
		super(Publication.WalletSaved, payload);
	}
}
