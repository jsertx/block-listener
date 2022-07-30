import { BlockchainId } from "../../Values/Blockchain";
import { Publication } from "../../../Infrastructure/Broker/Publication";
import { BaseMessage } from "./BaseMessage";

export interface TxDiscoveredMsgPayload {
  blockchain: BlockchainId;
  hash: string;
}

export class TxDiscoveredMsg extends BaseMessage<TxDiscoveredMsgPayload> {
  constructor(blockchain: BlockchainId, payload: TxDiscoveredMsgPayload) {
    super(Publication.TxDiscovered(blockchain), payload);
  }
}
