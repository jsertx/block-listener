import { EventEmitter } from "eventemitter3";
import { injectable } from "inversify";
import {
  IBroker,
  IPublicationReceipt,
  ISubscription,
} from "../../Interfaces/IBroker";

@injectable()
export class EventBroker implements IBroker {
  private emitter = new EventEmitter();
  async publish<T = any>(
    channel: string,
    event: T
  ): Promise<IPublicationReceipt> {
    const success = this.emitter.emit(channel, event);
    if (!success) {
      throw new Error(`Error publishing into ${channel}`);
    }
    return {
      success,
    };
  }
  async subscribe<T = any>(
    channel: string,
    callback: (event: T) => any
  ): Promise<ISubscription> {
    this.emitter.on(channel, callback);
    return {
      off: () => {
        this.emitter.off(channel, callback);
      },
    };
  }
}
