import { EventEmitter } from "eventemitter3";
import { injectable } from "inversify";
import {
  IBroker,
  IBrokerSubscription,
  IBrokerPublicationReceipt,
  IBrokerSubCallback,
} from "../../../Interfaces/IBroker";
import { EventChannel } from "../../Enums/Channel";

@injectable()
export class EventBus implements IBroker<EventChannel> {
  private emitter = new EventEmitter();
  async publish<T = any>(
    publication: EventChannel,
    event: T
  ): Promise<IBrokerPublicationReceipt> {
    const success = this.emitter.emit(publication, event);
    if (!success) {
      throw new Error(`Error publishing into ${publication}`);
    }
    return {
      success,
    };
  }

  async subscribe<T = any>(
    publication: EventChannel,
    callback: IBrokerSubCallback<T>
  ): Promise<IBrokerSubscription> {
    this.emitter.on(publication, callback);
    return {
      off: () => {
        this.emitter.off(publication, callback);
      },
    };
  }
}
