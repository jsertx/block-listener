import { createBrokerAsPromised, VhostConfig, PublicationConfig } from "rascal";
import { IConfig } from "../../../../Interfaces/IConfig";
import { Publication } from "../../Publication";
import { Subscription } from "../../Subscription";
import { RoutingKey, Exchange, Queue } from "../Enums";
import { BindingSetup, PublicationSetup } from "./Types";

const getConnections = (brokerUrl: string) => {
  const BROKER_URL = new URL(brokerUrl);
  return [
    {
      hostname: BROKER_URL.hostname,
      user: BROKER_URL.username,
      password: BROKER_URL.password,
      port: BROKER_URL.port,
      options: {
        heartbeat: 100,
      },
      socketOptions: {
        timeout: 100_000,
      },
    },
  ];
};

const bindingsSetup: BindingSetup[] = [
  [Exchange.Block, RoutingKey.BlockReceived, Queue.FindDirectTx],
  [Exchange.Block, RoutingKey.BlockReceived, Queue.FindInternalTx],
  [Exchange.Tx, RoutingKey.TxDiscovered, Queue.SaveTx],
  [Exchange.Token, RoutingKey.TokenDiscovered, Queue.SaveToken],
  [Exchange.Wallet, RoutingKey.WhaleDiscovered, Queue.SaveWhale],
];
const publicationsSetup: PublicationSetup[] = [
  [Publication.BlockReceived, Exchange.Block, RoutingKey.BlockReceived],
  [Publication.TxDiscovered, Exchange.Tx, RoutingKey.TxDiscovered],
  [Publication.TokenDiscovered, Exchange.Token, RoutingKey.TokenDiscovered],
  [Publication.WhaleDiscovered, Exchange.Wallet, RoutingKey.WhaleDiscovered],
];
export const createBrokerConnection = (config: IConfig) => {
  const bindings = bindingsSetup.reduce(
    expandBindingsByBlockchain(config.enabledBlockchains),
    []
  );
  const publications = publicationsSetup.reduce(
    expandPublicationsByBlockchain(config.enabledBlockchains),
    {}
  );

  let vhostConfig: VhostConfig = {
    connections: getConnections(config.broker.brokerUri),
    exchanges: Object.values(Exchange),
    queues: Object.values(Queue),
    bindings,
    publications,
    subscriptions: {
      [Subscription.FindDirectTx]: {
        queue: Queue.FindDirectTx,
      },
      [Subscription.FindInternalTx]: {
        queue: Queue.FindInternalTx,
      },
      [Subscription.SaveTx]: {
        queue: Queue.SaveTx,
      },
      [Subscription.SaveToken]: {
        queue: Queue.SaveToken,
      },
      [Subscription.SaveWhale]: {
        queue: Queue.SaveWhale,
      },
      [Subscription.SaveToken]: {
        queue: Queue.SaveToken,
      },
    },
  };
  return createBrokerAsPromised({
    vhosts: {
      "/": vhostConfig,
    },
  });
};

function expandBindingsByBlockchain(blockchains: string[]) {
  return (
    bindings: string[],
    [ex, routingKeyCreator, queue]: BindingSetup
  ): string[] => {
    const expandedBindings = blockchains.map(
      (blockchain) => `${ex}[${routingKeyCreator(blockchain)}] -> ${queue}`
    );
    return [...bindings, ...expandedBindings];
  };
}
type Pubs = Record<string, PublicationConfig>;

function expandPublicationsByBlockchain(blockchains: string[]) {
  return (
    pubs: Pubs,
    [publicationCreator, exchange, routingKeyCreator]: PublicationSetup
  ): Pubs => {
    const newPubs: Pubs = blockchains.reduce((pubs, blockchain) => {
      return {
        [publicationCreator(blockchain)]: {
          exchange,
          routingKey: routingKeyCreator(blockchain),
        },
      };
    }, {} as Pubs);

    return { ...pubs, ...newPubs };
  };
}
