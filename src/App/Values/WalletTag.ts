export enum WalletTagName {
	FoundIteratingBlocks = "found-iterating-blocks",
	FoundByIncomingTransfer = "found-by-incoming-transfer",
	AddedManually = "added-manually"
}
export const walletTagNameList = Object.values(WalletTagName);

export interface WalletTag {
	tag: WalletTagName;
	createdAt: Date;
}
