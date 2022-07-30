import { BlockchainId } from "../../Values/Blockchain";
import { Publication } from "../../../Infrastructure/Broker/Publication";
import { BaseMessage } from "./BaseMessage";

export interface WhaleDiscoveredMsgPayload {
  blockchain: BlockchainId;
  address: string;
}

export class WhaleDiscoveredMsg extends BaseMessage<WhaleDiscoveredMsgPayload> {
  constructor(blockchain: BlockchainId, payload: WhaleDiscoveredMsgPayload) {
    super(Publication.WhaleDiscovered(blockchain), payload);
  }
}
