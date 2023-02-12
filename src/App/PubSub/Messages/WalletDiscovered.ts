import { BlockchainId } from "../../Values/Blockchain";
import { ExecutorMessage } from "../../../Infrastructure/Broker/Executor";
import { WalletTagName } from "../../Values/WalletTag";
import { AddressRelation } from "../../Entities/Wallet";
import { WalletType } from "../../Values/WalletType";
import { Publication } from "../../../Infrastructure/Broker/Rabbitmq/Enums";

export interface WalletDiscoveredPayload {
	blockchain: BlockchainId;
	alias?: string;
	address: string;
	type: WalletType;
	tags?: WalletTagName[];
	relations?: Omit<AddressRelation, "createdAt">[];
}

export class WalletDiscovered extends ExecutorMessage<WalletDiscoveredPayload> {
	constructor(payload: WalletDiscoveredPayload) {
		super(Publication.WalletDiscovered, payload);
	}
}
