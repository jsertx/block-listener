import { BlockchainId } from "../../Values/Blockchain";
import { Publication } from "../../../Infrastructure/Broker/Publication";
import { BaseMessage } from "../../../Infrastructure/Broker/BaseMessage";

export interface WalletSavedPayload {
	blockchain: BlockchainId;
	address: string;
}

export class WalletSaved extends BaseMessage<WalletSavedPayload> {
	constructor(payload: WalletSavedPayload) {
		super(Publication.WalletSaved(payload.blockchain), payload);
	}
}
