import { BlockchainId } from "../Config/Blockchains";

export interface IBlockchainProviderConfig {
	url: string;
}
export interface IConfig {
	providers: Record<BlockchainId, IBlockchainProviderConfig[]>;
	enabledBlockchains: BlockchainId[];
	covalent: {
		apiKey: string;
	};
	database: {
		database?: string;
		connectionUri: string;
	};
	http: {
		port: string;
	};
	broker: {
		brokerUri: string;
	};
	txRules: {
		minNativeTransferValue: string;
		minDexSwapValueInUsd: string;
	};
}
