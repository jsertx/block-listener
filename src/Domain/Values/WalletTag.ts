export enum WalletTagName {
  ListingInsider = "listing.insider",
  TopMarketCapTrader = "top.insider",
}

export interface WalletTag {
  tag: WalletTagName;
  createdAt: Date;
}
