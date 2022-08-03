import { Blockchain } from "../../App/Values/Blockchain";

export type PublicationCreator = (
	blockchain: string,
	prefix?: string
) => string;
const publicationCreatorFactory =
	(publication: string): PublicationCreator =>
	(blockchain: string, _prefix?: string) => {
		const prefix = _prefix ? `${_prefix}.` : "";
		return `${prefix}${
			new Blockchain(blockchain as any).id
		}.${publication}`;
	};

export const Publication = {
	BlockReceived: publicationCreatorFactory("block_received"),
	TxDiscovered: publicationCreatorFactory("tx_dicovered"),
	WhaleDiscovered: publicationCreatorFactory("whale_discovered"),
	WhaleSaved: publicationCreatorFactory("whale_saved"),
	TokenDiscovered: publicationCreatorFactory("token_discovered")
};
