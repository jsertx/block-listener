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
	TransferSent = "transfer.sent",
	TransferReceived = "transfer.received"
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

export type WalletCreateProps = SetOptional<
	WalletRaw,
	"tags" | "relations" | "createdAt"
>;

export class Wallet extends Entity<WalletProps> {
	constructor(props: WalletPropsConstructor, _id?: string) {
		super({ relations: [], tags: [], ...props }, _id);
	}

	addRelation(newRel: SetOptional<AddressRelation, "createdAt">) {
		const existing = this.props.relations.some(
			(rel) => rel.address === newRel.address && rel.type === newRel.type
		);

		if (existing) {
			return;
		}

		this.props.relations.push({
			...newRel,
			createdAt: newRel.createdAt || new Date()
		});
	}

	setType(type: WalletType) {
		this.props.type = type;
	}
	setAlias(alias: string) {
		this.props.alias = alias;
	}

	addTag(tag: SetOptional<WalletTag, "createdAt"> | WalletTagName) {
		const newTag =
			typeof tag === "string" ? { tag, createdAt: new Date() } : tag;

		const existing = this.props.tags.some((rel) => rel.tag === newTag.tag);

		if (existing) {
			return;
		}

		this.props.tags.push({
			...newTag,
			createdAt: newTag.createdAt || new Date()
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

	static create(props: WalletCreateProps, _id?: string): Wallet {
		return new Wallet(
			validateOrThrowError(
				{ relations: [], tags: [], createdAt: new Date(), ...props },
				WalletSchema
			),
			_id
		);
	}
}
