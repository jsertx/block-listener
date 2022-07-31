import { BlockchainId } from "../../Values/Blockchain";
import { Publication } from "../../../Infrastructure/Broker/Publication";
import { BaseMessage } from "../../../Infrastructure/Broker/BaseMessage";

export interface WhaleSavedPayload {
  blockchain: BlockchainId;
  address: string;
}

export class WhaleSaved extends BaseMessage<WhaleSavedPayload> {
  constructor(blockchain: BlockchainId, payload: WhaleSavedPayload) {
    super(Publication.WhaleSaved(blockchain), payload);
  }
}
