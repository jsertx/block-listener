import { ethers } from "ethers";
import { inject } from "inversify";
import { interfaces, controller, httpGet } from "inversify-express-utils";
import { Tx } from "../../Domain/Entities/Tx";
import { TxType } from "../../Domain/Values/Tx";
import { ITxRepository } from "../../Interfaces/Repository/ITxRepository";
import { IocKey } from "../../Ioc/IocKey";
import { IApiResponse } from "../Types/Response";

@controller("/tx")
export class TxController implements interfaces.Controller {
  constructor(
    @inject(IocKey.TxRepository) private txRepository: ITxRepository
  ) {}
  @httpGet("/")
  async getAllTransfers(): Promise<IApiResponse<Tx[]>> {
    const data = await this.txRepository.findAll();
    return {
      success: true,
      data,
    };
  }

  @httpGet("/eth")
  async getEthTransfers(): Promise<IApiResponse<Tx[]>> {
    const data = await this.txRepository.findAll();
    return {
      success: true,
      data: data.filter((tx) => tx.type === TxType.EthTransfer),
    };
  }
}
