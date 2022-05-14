import { ethers } from "ethers";
import { UnprocessedTx } from "../Entities/Tx";
import { Blockchain } from "../Values/Blockchain";

export const createUnprocessedTx = ({
  blockchain,
  raw,
}: {
  blockchain: Blockchain;
  raw: ethers.providers.TransactionResponse;
}): UnprocessedTx => ({
  blockchain,
  raw,
});
