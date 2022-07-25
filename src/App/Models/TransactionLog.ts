export interface TransactionLog {
    tx_hash: string;
    name: string;
    signature: string;
    topic: string;
    address: string;
    args: Record<string, any>;
  }
  