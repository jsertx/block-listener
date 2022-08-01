export enum WalletTagName {
	ListingInsider = "listing.insider",
	TopMarketCapTrader = "top.insider"
}
export const walletTagNameList = Object.values(WalletTagName);

export interface WalletTag {
	tag: WalletTagName;
	createdAt: Date;
}
