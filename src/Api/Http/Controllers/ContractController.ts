import { inject } from "inversify";
import {
  interfaces,
  controller,
  httpGet,
  httpPost,
  requestBody,
} from "inversify-express-utils";

import { IocKey } from "../../../Ioc/IocKey";
import { IApiPaginatedResponse, IApiResponse } from "../Types/Response";
import { buildPaginatedResponse } from "../Utils/Response";
import { validateOrThrowError } from "../Utils/Validation";
import { Contract, ContractRaw } from "../../../App/Entities/Contract";
import { CreateContractDto, CreateContractDtoSchema } from "../Dto/ContractDto";
import { IContractRepository } from "../../../App/Repository/IContractRepository";

@controller("/contracts")
export class ContractController implements interfaces.Controller {
  constructor(
    @inject(IocKey.ContractRepository)
    private contractRepository: IContractRepository
  ) {}

  @httpGet("/")
  async index(): Promise<IApiPaginatedResponse<ContractRaw>> {
    const { data } = await this.contractRepository.findAll();
    return buildPaginatedResponse({
      data: data.map((data) => data.toRaw()),
    });
  }

  @httpPost("/")
  async createContract(
    @requestBody() body: CreateContractDto
  ): Promise<IApiResponse> {
    validateOrThrowError(body, CreateContractDtoSchema);
    const contract = await this.contractRepository.save(
      Contract.create({ ...body, createdAt: new Date() })
    );
    return {
      success: true,
      data: contract.toRaw(),
    };
  }
}
