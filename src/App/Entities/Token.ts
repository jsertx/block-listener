import Joi from "joi";
import { checksumed } from "../Utils/Address";
import { toFormatted, toPrecision } from "../Utils/Amount";
import { validateOrThrowError } from "../Utils/Validation";
import { HexAddressStr } from "../Values/Address";
import { Blockchain, BlockchainId } from "../Values/Blockchain";
import { Entity } from "./Base/Entity";

export interface TokenIdProps {
	address: HexAddressStr;
	blockchain: BlockchainId;
}
export interface TokenProps extends TokenIdProps {
	symbol: string;
	name: string;
	decimals: number;
	useAsBaseForPairDiscovery: boolean;
	isStable: boolean;
	isNativeWrapped: boolean;
}

const TokenSchema = Joi.object({
	address: Joi.string().custom(checksumed).required(),
	blockchain: Joi.string().required(),
	symbol: Joi.string().required(),
	name: Joi.string().required(),
	decimals: Joi.number().greater(-1).required(),
	useAsBaseForPairDiscovery: Joi.boolean().default(false),
	isStable: Joi.boolean().default(false),
	isNativeWrapped: Joi.boolean().default(false)
})
	.unknown()
	.options({ stripUnknown: true });

export class Token extends Entity<TokenProps> {
	get blockchain(): Blockchain {
		return new Blockchain(this.props.blockchain);
	}
	get isStable(): boolean {
		return this.props.isStable;
	}
	get useAsBaseForPairDiscovery(): boolean {
		return this.props.useAsBaseForPairDiscovery;
	}

	get address(): string {
		return this.props.address;
	}

	get symbol(): string {
		return this.props.symbol;
	}

	get name(): string {
		return this.props.name;
	}

	get decimals(): number {
		return this.props.decimals;
	}

	toFormatted(value: string) {
		return toFormatted(value, this.decimals);
	}

	toPrecision(value: string) {
		return toPrecision(value, this.decimals);
	}
	static create(props: TokenProps, _id?: string): Token {
		return new Token(validateOrThrowError(props, TokenSchema), _id);
	}
}
