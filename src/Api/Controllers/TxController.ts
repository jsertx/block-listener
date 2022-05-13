import { ethers } from "ethers";
import { inject } from "inversify";
import { interfaces, controller, httpGet } from "inversify-express-utils";
import { ITxRepository } from "../../Interfaces/Repository/ITxRepository";
import { IocKey } from "../../Ioc/IocKey";
import { IApiResponse } from "../Types/Response";

@controller("/tx")
export class TxController implements interfaces.Controller {
  constructor(
    @inject(IocKey.TxRepository) private txRepository: ITxRepository
  ) {}
  @httpGet("/")
  async index(): Promise<IApiResponse<ethers.providers.TransactionReceipt[]>> {
    const data = await this.txRepository.findAll();
    return {
      success: true,
      data,
    };
  }
}
