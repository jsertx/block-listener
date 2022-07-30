import { BlockchainId } from "../../Values/Blockchain";
import { Publication } from "../../../Infrastructure/Broker/Publication";
import { BaseMessage } from "../../../Infrastructure/Broker/BaseMessage";

export interface TxDiscoveredPayload {
  blockchain: BlockchainId;
  hash: string;
}

export class TxDiscovered extends BaseMessage<TxDiscoveredPayload> {
  constructor(blockchain: BlockchainId, payload: TxDiscoveredPayload) {
    super(Publication.TxDiscovered(blockchain), payload);
  }
}
