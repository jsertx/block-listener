import Joi from "joi";
import { SetOptional } from "type-fest";
import { checksumed } from "../Utils/Address";

import { validateOrThrowError } from "../Utils/Validation";
import { HexAddressStr } from "../Values/Address";
import {
	Blockchain,
	BlockchainId,
	blockchainIdList
} from "../Values/Blockchain";
import {
	WalletTag,
	WalletTagName,
	walletTagNameList
} from "../Values/WalletTag";
import { WalletType, walletTypeList } from "../Values/WalletType";
import { Entity } from "./Base/Entity";

export interface WalletIdProps {
	blockchain: BlockchainId;
	address: HexAddressStr;
}
export interface WalletProps extends WalletIdProps {
	alias?: string;

	type: WalletType;
	tags: WalletTag[];
	relations: AddressRelation[];
	createdAt: Date;
}
type WalletPropsConstructor = SetOptional<WalletProps, "relations" | "tags">;

export type WalletRaw = WalletProps;

export enum AddressRelationType {
	TransferedAsset = "transfer.sent",
	ReceivedAsset = "transfer.received"
}

export const addressRelationTypeList = Object.values(AddressRelationType);

export interface AddressRelation {
	address: string;
	type: AddressRelationType;
	createdAt: Date;
	metadata?: {
		txHash?: string;
	};
}

export const WalletRelationSchema = Joi.object({
	address: Joi.string().required(),
	type: Joi.string()
		.valid(...addressRelationTypeList)
		.required(),
	metadata: Joi.object({
		txHash: Joi.string().optional()
	}).optional()
});

export const WalletAddressTagSchema = Joi.object({
	tag: Joi.string().valid(...walletTagNameList)
});

export const WalletSchema = Joi.object({
	blockchain: Joi.string()
		.valid(...blockchainIdList)
		.required(),
	address: Joi.string().custom(checksumed).required(),
	type: Joi.string()
		.valid(...walletTypeList)
		.required(),
	relations: Joi.array().items(WalletRelationSchema).optional(),
	alias: Joi.string().optional(),
	tags: Joi.array().items(WalletAddressTagSchema).optional(),
	createdAt: Joi.date().required()
})
	.unknown()
	.options({ stripUnknown: true });

export class Wallet extends Entity<WalletProps> {
	constructor(props: WalletPropsConstructor, _id?: string) {
		super({ relations: [], tags: [], ...props }, _id);
	}
	addRelation(rel: SetOptional<AddressRelation, "createdAt">) {
		this.props.relations.push({
			...rel,
			createdAt: rel.createdAt || new Date()
		});
	}

	addTag(tag: SetOptional<WalletTag, "createdAt"> | WalletTagName) {
		if (typeof tag === "string") {
			this.props.tags.push({ tag, createdAt: new Date() });
			return;
		}
		this.props.tags.push({
			...tag,
			createdAt: tag.createdAt || new Date()
		});
	}

	get relations(): AddressRelation[] {
		return this.props.relations;
	}

	get tags(): WalletTag[] {
		return this.props.tags;
	}

	get type(): WalletType {
		return this.props.type;
	}

	get address(): HexAddressStr {
		return this.props.address;
	}

	get blockchain(): Blockchain {
		return new Blockchain(this.props.blockchain);
	}

	static create(
		props: SetOptional<WalletRaw, "tags" | "relations">,
		_id?: string
	): Wallet {
		return new Wallet(
			validateOrThrowError(
				{ relations: [], tags: [], ...props },
				WalletSchema
			),
			_id
		);
	}
}
