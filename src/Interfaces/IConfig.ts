import Bottleneck from "bottleneck";
import { BlockchainId } from "../Config/Blockchains";

export interface IBlockchainProviderConfig {
	url: string;
	rateConfig: Bottleneck.ConstructorOptions;
}

export interface ITxRuleConfig {
	minNativeTransferValueInUsd: string;
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
	logtail: {
		// if undefined disabled
		accessToken?: string;
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
