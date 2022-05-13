export interface ITxRepository {
  saveTx(tx: any): Promise<void>;
}
