import Joi from "joi";
import { HexAddressStr } from "../../../App/Values/Address";
import { BlockchainId } from "../../../App/Values/Blockchain";

export interface CreateTokenDto {
	address: HexAddressStr;
	blockchain: BlockchainId;
	symbol: string;
	name: string;
	decimals: number;
	useAsBaseForPairDiscovery: boolean;
}

export const CreateTokenDtoSchema = Joi.object({
	address: Joi.string().required(),
	blockchain: Joi.string().required(),
	symbol: Joi.string().required(),
	name: Joi.string().required(),
	decimals: Joi.number().greater(-1).required(),
	useAsBaseForPairDiscovery: Joi.boolean().default(false)
});
