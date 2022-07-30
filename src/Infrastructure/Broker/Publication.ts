export type PublicationCreator = (blockchain: string) => string;
const publicationCreatorFactory =
  (publication: string) => (blockchain: string) =>
    `${blockchain}.${publication}`;

export const Publication = {
  BlockReceived: publicationCreatorFactory("block_received"),
  FindDirectTx: publicationCreatorFactory("find_direct_tx"),
  FindInternalTx: publicationCreatorFactory("find_internal_tx"),
  SaveTx: publicationCreatorFactory("save_tx"),
  WhaleDiscovered: publicationCreatorFactory("whale.evt.discovered"),
  TokenDiscovered: publicationCreatorFactory("token.evt.discovered"),
};
