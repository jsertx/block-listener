import { HexAddressStr } from "../Values/Address";

export interface TransactionLog {
	tx_hash: string;
	name: string;
	signature: string;
	topic: string;
	address: HexAddressStr;
	args: Record<string, any>;
}
