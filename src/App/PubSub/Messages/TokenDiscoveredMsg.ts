import { BlockchainId } from "../../Values/Blockchain";
import { Publication } from "../../../Infrastructure/Broker/Publication";
import { BaseMessage } from "./BaseMessage";

export interface TokenDiscoveredMsgPayload {
  blockchain: BlockchainId;
  address: string;
}

export class TokenDiscoveredMsg extends BaseMessage<TokenDiscoveredMsgPayload> {
  constructor(blockchain: BlockchainId, payload: TokenDiscoveredMsgPayload) {
    super(Publication.TokenDiscovered(blockchain), payload);
  }
}
