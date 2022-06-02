import { createBrokerAsPromised, VhostConfig } from "rascal";

const getConnections = (brokerUrl: string) => {
  const BROKER_URL = new URL(brokerUrl);
  return [
    {
      url: brokerUrl,
    },
    {
      hostname: BROKER_URL.hostname,
      user: BROKER_URL.username,
      password: BROKER_URL.password,
      port: BROKER_URL.port,
      options: {
        heartbeat: 1,
      },
      socketOptions: {
        timeout: 1000,
      },
    },
  ];
};

export const createBrokerConnection = (brokerUri: string) => {
  let vhostConfig: VhostConfig = {
    connections: getConnections(brokerUri),
    exchanges: ["wallets", "contracts"],
    bindings: [
      `wallets[wallet.cmd.create] -> create_wallet`,
      `contracts[contract.cmd.create] -> create_contract`,
    ],
    queues: {
      create_wallet: {},
      create_contract: {},
    },
    publications: {
      create_wallet: {
        exchange: "wallets",
        routingKey: "wallet.cmd.create",
      },
      create_contract: {
        exchange: "contracts",
        routingKey: "contract.cmd.create",
      },
    },
    subscriptions: {
      create_wallet: {
        queue: "create_wallet",
      },
      create_contract: {
        queue: "create_contract",
      },
    },
  };
  return createBrokerAsPromised({
    vhosts: {
      "/": vhostConfig,
    },
  });
};
