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
export enum BrokerType {
	Rabbit = "rabbitmq"
}
export interface IRabbitBrokerConfig {
	uri: string;
	apiUrl: string;
}
export interface ILogtailConfig {
	accessToken: string;
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
	// if undefined disabled
	logtail?: ILogtailConfig;
	database: {
		database?: string;
		connectionUri: string;
	};
	http: {
		port: string;
	};
	broker: {
		type: BrokerType;
		config: IRabbitBrokerConfig;
	};
	txRules: Record<BlockchainId, ITxRuleConfig>;
	blockListener: {
		maxSaveTxMessagesToHalt: number;
	};
}
