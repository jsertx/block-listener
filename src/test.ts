import "reflect-metadata";
import "dotenv/config";
import { initializeContainer } from "./Ioc/container";

import { IocKey } from "./Ioc/IocKey";
import { IStandaloneApps } from "./App/Interfaces/IStandaloneApps";
import { IBroker } from "./Interfaces/IBroker";
import { SaveTx } from "./App/UseCases/SaveTx";
import { Blockchain, BlockchainId } from "./App/Values/Blockchain";
import { Publication } from "./Infrastructure/Broker/Publication";
import { Axios } from "axios";

(async () => {
  const key = "ckey_eb820bc39cc34f4dba4b680c759";
  const client = new Axios({
    baseURL: "https://api.covalenthq.com/v1/",
  });
  function addApiKey(config: any) {
    console.log("config", config);
    return { ...config, url: `${config.url}/?key=${key}` };
  }
  client.interceptors.request.use(addApiKey);
  client.interceptors.response.use((res) => {
    //console.log(res.data);
    return JSON.parse(res.data);
  });

  client
    .get(
      `/1/address/0x52856Ca4ddb55A1420950857C7882cFC8E02281C/transactions_v2`
    )
    .then((res) => {
      console.log(res.data.items[0].tx_hash);
    });
})();
