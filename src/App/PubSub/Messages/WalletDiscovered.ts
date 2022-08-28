import { BlockchainId } from "../../Values/Blockchain";
import { Publication } from "../../../Infrastructure/Broker/Publication";
import { ExecutorMessage } from "../../../Infrastructure/Broker/Executor";
import { WalletTagName } from "../../Values/WalletTag";
import { AddressRelation } from "../../Entities/Wallet";

export interface WalletDiscoveredPayload {
	blockchain: BlockchainId;
	address: string;
	tags?: WalletTagName[];
	relations?: Omit<AddressRelation, "createdAt">[];
}

export class WalletDiscovered extends ExecutorMessage<WalletDiscoveredPayload> {
	constructor(payload: WalletDiscoveredPayload) {
		super(Publication.WalletDiscovered(payload.blockchain), payload);
	}
}
