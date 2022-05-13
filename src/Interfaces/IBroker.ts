export interface IPublicationReceipt {
  success: boolean;
}

export interface ISubscription {
  off: () => void;
}

export interface IBroker {
  publish<T = any>(channel: string, event: T): Promise<IPublicationReceipt>;
  subscribe<T = any>(
    channel: string,
    callback: (event: T) => void
  ): Promise<ISubscription>;
}
