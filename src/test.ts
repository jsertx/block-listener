import "reflect-metadata";
import "dotenv/config";
import { initializeContainer } from "./Ioc/container";

import { IocKey } from "./Ioc/IocKey";
import { IStandaloneApps } from "./App/Interfaces/IStandaloneApps";
import { IBroker } from "./Interfaces/IBroker";
import { SaveTx } from "./App/UseCases/SaveTx";
import { Blockchain, BlockchainId } from "./App/Values/Blockchain";
import { EventChannel } from "./App/Enums/Channel";

(async () => {
  const container = await initializeContainer();

  container
    .getAll<IStandaloneApps>(IocKey.StandAloneApps)
    .filter((listener) => {
      return ["SaveWhale", "SaveTx", "SaveToken"].includes(
        listener.constructor.name
      );
    })
    .forEach((listener) => listener.start());

  container.get<IBroker>(IocKey.EventBus).publish(EventChannel.SaveTx, {
    blockchain: new Blockchain(BlockchainId.Ethereum),
    hash: "0x292af104617f967b55f43e90afbd070f7d0cd8a3e80c59af3fe219207d4c4456",
  });
})();
