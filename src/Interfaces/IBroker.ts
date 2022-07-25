export type IBrokerSubCallback<T = any> = (
  message: T,
  ack: () => any,
  nack: (error: any) => any
) => Promise<any>;

export interface IBrokerPublicationReceipt {
  success: boolean;
}

export interface IBrokerSubscription {
  off: () => void;
}

export interface IBroker<ChannelNames = string> {
  publish<T = any>(
    channel: ChannelNames,
    message: T
  ): Promise<IBrokerPublicationReceipt>;
  subscribe(
    channel: ChannelNames,
    callback: IBrokerSubCallback
  ): Promise<IBrokerSubscription>;
}
