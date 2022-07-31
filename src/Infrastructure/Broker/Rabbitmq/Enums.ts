export enum Exchange {
  Block = "block",
  Wallet = "wallet",
  Contract = "contract",
  Token = "token",
  Tx = "tx",
}

export enum Queue {
  FindDirectTx = "find_direct_tx",
  FindInternalTx = "find_internal_tx",
  FindWhaleTxs = "find_whale_tx",
  SaveWhale = "save_whale",
  SaveTx = "save_tx",
  SaveToken = "save_token",
}

export type RoutingKeyCreator = (blockchain: string) => string;
const routingKeyCreatorFactory = (binding: string) => (blockchain: string) =>
  `${blockchain}.${binding}`;

export const RoutingKey = {
  BlockReceived: routingKeyCreatorFactory("block.evt.received"),
  WhaleDiscovered: routingKeyCreatorFactory("wallet.evt.whale_discovered"),
  TokenDiscovered: routingKeyCreatorFactory("token.evt.discovered"),
  TxDiscovered: routingKeyCreatorFactory("tx.evt.discovered"),
  WhaleSaved: routingKeyCreatorFactory("wallet.evt.whale_saved"),
};
