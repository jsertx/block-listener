import { inject, injectable } from "inversify";
import { IocKey } from "../../Ioc/IocKey";
import { BrokerAsPromised } from "rascal";
import {
  IBroker,
  IBrokerPublicationReceipt,
  IBrokerSubscription,
} from "../../Interfaces/IBroker";
import { ILogger } from "../../Interfaces/ILogger";

@injectable()
export class RabbitMQ implements IBroker {
  constructor(
    @inject(IocKey.BrokerClient) private client: BrokerAsPromised,
    @inject(IocKey.Logger) private logger: ILogger
  ) {}

  async publish<T = any>(
    channel: string,
    message: T
  ): Promise<IBrokerPublicationReceipt> {
    await this.client.publish(channel, message).catch((error) => {
      this.logger.error({
        message: "Failed message",
        type: "pubsub.publish",
        success: false,
        error,
        context: {
          channel,
        },
      });
      throw error;
    });
    return { success: true };
  }
  async subscribe(
    channel: string,
    callback: (
      message: any,
      ack: () => any,
      nack: (error: Error) => any
    ) => Promise<any>
  ): Promise<IBrokerSubscription> {
    const subscription = await this.client.subscribe(channel);
    this.logger.log({
      message: `Subscribed to ${channel}`,
      type: "pubsub.subscribe",
      success: true,
      context: {
        channel,
      },
    });
    subscription
      .on("message", (message, content, ackOrNack) => {
        const ack = () => ackOrNack();
        const nack = (...args: any[]) => ackOrNack(...args);
        callback(content, ack, nack);
      })
      .on("error", (error) => {
        this.logger.error({
          message: `Subscription error at ${channel}`,
          type: "pubsub.subscription",
          error,
          context: {
            channel,
          },
        });
      });
    return {
      off: () => {
        this.logger.log({
          message: `Unsubscribed from ${channel}`,
          type: "pubsub.unsubscribe",
          success: true,
          context: {
            channel,
          },
        });

        subscription.cancel();
      },
    };
  }
}
