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

export enum PublicationTypes {
	BlockReceived = "block_received",
	TxDiscovered = "tx_dicovered",
	WalletDiscovered = "wallet_discovered",
	WalletSaved = "wallet_saved",
	TokenDiscovered = "token_discovered"
}
export const Publication = {
	BlockReceived: publicationCreatorFactory(PublicationTypes.BlockReceived),
	TxDiscovered: publicationCreatorFactory(PublicationTypes.TxDiscovered),
	WalletDiscovered: publicationCreatorFactory(
		PublicationTypes.WalletDiscovered
	),
	WalletSaved: publicationCreatorFactory(PublicationTypes.WalletSaved),
	TokenDiscovered: publicationCreatorFactory(PublicationTypes.TokenDiscovered)
};
