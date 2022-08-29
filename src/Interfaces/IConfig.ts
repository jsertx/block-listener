import { BlockchainId } from "../Config/Blockchains";

export interface IBlockchainProviderConfig {
	url: string;
}
export interface ITxRuleConfig {
	minNativeTransferValue: string;
	minDexSwapValueInUsd: string;
}
export interface IConfig {
	providers: Record<BlockchainId, IBlockchainProviderConfig[]>;
	enabledBlockchains: BlockchainId[];
	covalent: {
		apiKey: string;
	};
	finnhub: {
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
	txRules: Record<BlockchainId, ITxRuleConfig>;
}
