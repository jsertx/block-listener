import Joi from "joi";
import { BlockWithTransactions } from "../Types/BlockWithTransactions";
import { validateOrThrowError } from "../Utils/Validation";
import { Blockchain, BlockchainId } from "../Values/Blockchain";
import { Entity } from "./Base/Entity";

export interface BlockIdProps {
	height: string;
	blockchain: BlockchainId;
}
export interface BlockProps extends BlockIdProps {
	timestamp: Date;
	raw: BlockWithTransactions;
}

const BlockSchema = Joi.object({
	height: Joi.string().required(),
	blockchain: Joi.string().required(),
	timestamp: Joi.date().required(),
	raw: Joi.any()
})
	.unknown()
	.options({ stripUnknown: true });

export class Block extends Entity<BlockProps> {
	get blockchain(): Blockchain {
		return new Blockchain(this.props.blockchain);
	}
	get height(): string {
		return this.props.height;
	}
	get timestamp(): Date {
		return this.props.timestamp;
	}
	get raw(): any {
		return this.props.raw;
	}

	static create(props: BlockProps, _id?: string): Block {
		return new Block(validateOrThrowError(props, BlockSchema), _id);
	}
}
