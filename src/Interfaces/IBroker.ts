export type IBrokerSubCallback = (
  message: any,
  ack: () => any,
  nack: (error: any) => any
) => Promise<any>;

export interface IBrokerPublicationReceipt {
  success: boolean;
}

export interface IBrokerSubscription {
  off: () => void;
}

export interface IBroker {
  publish<T = any>(
    channel: string,
    message: T
  ): Promise<IBrokerPublicationReceipt>;
  subscribe(
    channel: string,
    callback: IBrokerSubCallback
  ): Promise<IBrokerSubscription>;
}
