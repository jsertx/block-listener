import Joi, { ValidationResult } from "joi";
import { TransactionLog, TransactionLogSchema } from "../Types/TransactionLog";
import { checksumed } from "../Utils/Address";
import { validateOrThrowError } from "../Utils/Validation";
import { HexAddressStr } from "../Values/Address";
import { FormattedAmount } from "../Values/Amount";
import {
	Blockchain,
	BlockchainId,
	blockchainIdList
} from "../Values/Blockchain";
import { TxType, txTypeList } from "../Values/TxType";
import { Entity } from "./Base/Entity";

export interface RawTx {
	hash: string;
	blockHeight: number;
	timestamp: Date;
	data: string;
	to: string;
	from: string;
	value: string;
	logs: TransactionLog[];
	smartContractCall?: {
		method: string;
		signature: string;
		args: Record<string, any>;
	};
}
export interface TxIdProps {
	blockchain: BlockchainId;
	hash: string;
}
export interface TxProps<TxDataType = undefined> extends TxIdProps {
	type: TxType;
	raw: RawTx;
	data: TxDataType;
}

export interface EthTransferData {
	from: HexAddressStr;
	to: HexAddressStr;
	value: FormattedAmount;
	usdValue: FormattedAmount;
}

export interface DexSwapData {
	nativeValue: string;
	usdValue: string;
	from: string;
	to: string; //normally will be the same as "from"
	/*
	 estimated value fields are true when they where calculated throug PriceService 
	 rather than from the logs
	 undefined, should calculate later
	 */
	calculatedNativeValue?: boolean;
	calculatedUsdValue?: boolean;
	input: {
		token: HexAddressStr;
		symbol: string;
		amount: string;
	};
	output: {
		token: HexAddressStr;
		symbol: string;
		amount: string;
	};
}

export interface TokenTransferData {
	nativeValue: string;
	usdValue: string;
	from: string;
	to: string; //normally will be the same as "from"
	amount: string;
	token: {
		address: HexAddressStr;
		symbol: string;
	};
}

const EthTransferSchema = Joi.object({
	value: Joi.string().required(),
	usdValue: Joi.string().required(),
	from: Joi.string().custom(checksumed).required(),
	to: Joi.string().custom(checksumed).required()
})
	.unknown()
	.options({ stripUnknown: true });

const DexSwapDataSchema = Joi.object({
	nativeValue: Joi.string().required(),
	usdValue: Joi.string().required(),
	from: Joi.string().custom(checksumed).required(),
	to: Joi.string().custom(checksumed).required(),
	input: Joi.object({
		token: Joi.string().custom(checksumed).required(),
		amount: Joi.string().required()
	}),
	output: Joi.object({
		token: Joi.string().custom(checksumed).required(),
		amount: Joi.string().required()
	}).required()
})
	.unknown()
	.options({ stripUnknown: true });

const RawTxSchema = Joi.object({
	hash: Joi.string().required().required(),
	blockHeight: Joi.number().required().required(),
	timestamp: Joi.date().required(),
	data: Joi.string().required(),
	to: Joi.custom(checksumed).required(),
	from: Joi.custom(checksumed).required(),
	value: Joi.string(),
	logs: Joi.array().items(TransactionLogSchema),
	smartContractCall: Joi.object({
		method: Joi.string().required(),
		signature: Joi.string().required(),
		args: Joi.any()
	})
		.optional()
		.options({ stripUnknown: true })
})
	.unknown()
	.options({ stripUnknown: true });

const TxSchema = Joi.object({
	blockchain: Joi.valid(...blockchainIdList).required(),
	hash: Joi.string().required(),
	raw: RawTxSchema,
	type: Joi.string().valid(...txTypeList),
	data: Joi.alternatives(DexSwapDataSchema, EthTransferSchema)
});

export class Tx<DataTypeRaw = undefined> extends Entity<TxProps<DataTypeRaw>> {
	protected _blockchain: Blockchain;
	constructor(props: TxProps<DataTypeRaw>, _id?: string) {
		super(props, _id);
		this._blockchain = new Blockchain(props.blockchain);
	}
	get hash(): string {
		return this.props.hash;
	}

	get timestamp(): Date {
		return this.props.raw.timestamp;
	}

	get block(): number {
		return this.props.raw.blockHeight;
	}

	get isSmartContractCall(): boolean {
		return !!this.raw.smartContractCall;
	}

	get blockchain(): Blockchain {
		return this._blockchain;
	}

	get type(): TxType {
		return this.props.type;
	}

	get from(): string {
		return this.props.raw.from;
	}

	get raw(): RawTx {
		return this.props.raw;
	}
	get data(): DataTypeRaw {
		return this.props.data;
	}

	get smartContractCall(): Required<TxProps["raw"]>["smartContractCall"] {
		if (!this.props.raw.smartContractCall) {
			throw new Error("Not available");
		}
		return this.props.raw.smartContractCall;
	}

	setTypeAndData(type: TxType, data: DataTypeRaw) {
		this.props.type = type;
		let validation: ValidationResult;
		switch (this.props.type) {
			case TxType.DexSwap:
				validation = DexSwapDataSchema.validate(data);
				break;
			case TxType.EthTransfer:
				validation = EthTransferSchema.validate(data);
				break;
			default:
				throw new Error("Not supported tx type:" + type);
		}

		this.props.data = validation.value;
	}

	static create(props: TxProps, _id?: string): Tx<any> {
		return new Tx(validateOrThrowError(props, TxSchema), _id);
	}
}

export type EthTransferTxRaw = TxProps<EthTransferData>;
export class EthTransferTx extends Tx<EthTransferData> {}

export type DexSwapTxRaw = TxProps<DexSwapData>;
export class DexSwapTx extends Tx<DexSwapData> {}

export type TokenTransferTxRaw = TxProps<TokenTransferData>;
export class TokenTransferTx extends Tx<TokenTransferTxRaw> {}
