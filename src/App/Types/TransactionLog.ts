import Joi from "joi";
import { HexAddressStr } from "../Values/Address";

export interface TransactionLog {
	tx_hash: string;
	name: string;
	signature: string;
	topic: string;
	address: HexAddressStr;
	args: Record<string, any>;
}
export const TransactionLogSchema = Joi.object({
	tx_hash: Joi.string().required(),
	name: Joi.string().required(),
	signature: Joi.string().required(),
	topic: Joi.string().required(),
	address: Joi.string().required(),
	args: Joi.any()
})
	.unknown()
	.options({ stripUnknown: true });
