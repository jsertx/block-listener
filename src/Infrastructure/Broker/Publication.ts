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
	TxSaved = "tx_saved",
	WalletDiscovered = "wallet_discovered",
	WalletSaved = "wallet_saved",
	WalletUpdated = "wallet_updated",
	TokenDiscovered = "token_discovered"
}
export const Publication = {
	BlockReceived: publicationCreatorFactory(PublicationTypes.BlockReceived),
	TxSaved: publicationCreatorFactory(PublicationTypes.TxSaved),
	TxDiscovered: publicationCreatorFactory(PublicationTypes.TxDiscovered),
	WalletDiscovered: publicationCreatorFactory(
		PublicationTypes.WalletDiscovered
	),
	WalletSaved: publicationCreatorFactory(PublicationTypes.WalletSaved),
	WalletUpdated: publicationCreatorFactory(PublicationTypes.WalletUpdated),
	TokenDiscovered: publicationCreatorFactory(PublicationTypes.TokenDiscovered)
};
