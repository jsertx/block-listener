export type PublicationCreator = (blockchain: string) => string;
const publicationCreatorFactory =
  (publication: string) => (blockchain: string) =>
    `${blockchain}.${publication}`;

export const Publication = {
  BlockReceived: publicationCreatorFactory("block_received"),
  TxDiscovered: publicationCreatorFactory("tx_dicovered"),
  WhaleDiscovered: publicationCreatorFactory("whale_discovered"),
  TokenDiscovered: publicationCreatorFactory("token_discovered"),
};
