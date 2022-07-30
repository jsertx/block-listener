import { BlockWithTransactions } from "../../Types/BlockWithTransactions";
import { BlockchainId } from "../../Values/Blockchain";
import { Publication } from "../../../Infrastructure/Broker/Publication";
import { BaseMessage } from "./BaseMessage";

export interface BlockReceivedMsgPayload {
  blockchain: BlockchainId;
  block: BlockWithTransactions;
}
export class BlockReceivedMsg extends BaseMessage<BlockReceivedMsgPayload> {
  constructor(blockchain: BlockchainId, payload: BlockReceivedMsgPayload) {
    super(Publication.BlockReceived(blockchain), payload);
  }
}
