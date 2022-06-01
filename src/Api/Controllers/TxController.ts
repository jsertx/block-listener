import { inject } from "inversify";
import { interfaces, controller, httpGet } from "inversify-express-utils";
import { TxRaw } from "../../Domain/Entities/Tx";
import { TxType } from "../../Domain/Values/Tx";
import { ITxRepository } from "../../Domain/Repository/ITxRepository";
import { IocKey } from "../../Ioc/IocKey";
import { IApiPaginatedResponse, IApiResponse } from "../Types/Response";
import { buildPaginatedResponse } from "../Utils/Response";

@controller("/tx")
export class TxController implements interfaces.Controller {
  constructor(
    @inject(IocKey.TxRepository) private txRepository: ITxRepository
  ) {}
  @httpGet("/")
  async getAllTransfers(): Promise<IApiPaginatedResponse<TxRaw>> {
    const data = await this.txRepository.findAll();
    return buildPaginatedResponse({
      data: data.map((data) => data.toRaw()),
    });
  }

  @httpGet("/eth")
  async getEthTransfers(): Promise<IApiPaginatedResponse<TxRaw>> {
    const data = await this.txRepository.findAll();

    return buildPaginatedResponse({
      data: data
        .filter((tx) => tx.type === TxType.EthTransfer)
        .map((data) => data.toRaw()),
    });
  }
}
