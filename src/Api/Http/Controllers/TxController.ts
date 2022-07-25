import { inject } from "inversify";
import {
  interfaces,
  controller,
  httpGet,
  queryParam,
} from "inversify-express-utils";
import { TxProps } from "../../../App/Entities/Tx";
import { TxType } from "../../../App/Values/Tx";
import { ITxRepository } from "../../../App/Repository/ITxRepository";
import { IocKey } from "../../../Ioc/IocKey";
import { IApiPaginatedResponse, IApiResponse } from "../Types/Response";
import { buildPaginatedResponse } from "../Utils/Response";
import { TxSimplifiedDto } from "../Dto/TxDto";

@controller("/txs")
export class TxController implements interfaces.Controller {
  constructor(
    @inject(IocKey.TxRepository) private txRepository: ITxRepository
  ) {}

  @httpGet("/")
  async getAllTransfers(
    @queryParam("page") _page: string,
    @queryParam("pageSize") _pageSize: string
  ): Promise<IApiPaginatedResponse<TxSimplifiedDto>> {
    const { data, page, pageSize, total } = await this.txRepository.findAll({
      page: _page ? Number(_page) : 1,
      pageSize: _pageSize ? Number(_pageSize) : 500,
    });
    return buildPaginatedResponse({
      total,
      page,
      pageSize,
      data: data.map((tx) => {
        return {
          hash: tx.hash,
          blockchain: tx.blockchain.id,
          type: tx.type,
          timestamp: tx.timestamp,
          block: tx.block,
          data: tx.data,
        };
      }),
    });
  }
}
