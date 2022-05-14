import { UnprocessedTx } from "../Entities/Tx";

export const createUnprocessedTx = ({
  blockchain,
  raw,
}: UnprocessedTx): UnprocessedTx => ({
  blockchain,
  raw,
});
