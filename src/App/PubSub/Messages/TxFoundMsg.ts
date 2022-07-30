import { BlockchainId } from "../../Values/Blockchain";
import { Publication } from "../../../Infrastructure/Broker/Publication";
import { BaseMessage } from "./BaseMessage";

export interface TxFoundMsgPayload {
  blockchain: BlockchainId;
  hash: string;
}

export class TxFoundMsg extends BaseMessage<TxFoundMsgPayload> {
  constructor(blockchain: BlockchainId, payload: TxFoundMsgPayload) {
    super(Publication.BlockReceived(blockchain), payload);
  }
}
