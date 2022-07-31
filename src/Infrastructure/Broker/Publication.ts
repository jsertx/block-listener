export type PublicationCreator = (blockchain: string) => string;
const publicationCreatorFactory =
  (publication: string) => (blockchain: string) =>
    `${blockchain}.${publication}`;

export const Publication = {
  BlockReceived: publicationCreatorFactory("block_received"),
  TxDiscovered: publicationCreatorFactory("tx_dicovered"),
  WhaleDiscovered: publicationCreatorFactory("whale_discovered"),
  WhaleSaved: publicationCreatorFactory("whale_saved"),
  TokenDiscovered: publicationCreatorFactory("token_discovered"),
};
