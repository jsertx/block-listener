import { ethers } from "ethers";
import { inject } from "inversify";
import { interfaces, controller, httpGet } from "inversify-express-utils";
import { ITxRepository } from "../../Interfaces/Repository/ITxRepository";
import { IocKey } from "../../Ioc/IocKey";

@controller("/txs")
export class TxController implements interfaces.Controller {
  constructor(
    @inject(IocKey.TxRepository) private txRepository: ITxRepository
  ) {}
  @httpGet("/")
  async index(): Promise<ethers.providers.TransactionReceipt[]> {
    return this.txRepository.findAll();
  }
}
