import { inject } from "inversify";
import {
  interfaces,
  controller,
  httpGet,
  httpPost,
  requestBody,
} from "inversify-express-utils";
import { IAddressService } from "../../../Domain/Interfaces/IAddressService";

import { IocKey } from "../../../Ioc/IocKey";
import { ContractSchema } from "../Schemas/AddressSchema";
import { IApiPaginatedResponse, IApiResponse } from "../Types/Response";
import { buildPaginatedResponse } from "../Utils/Response";
import { validateOrThrowError } from "../Utils/Validation";
import { Contract, ContractRaw } from "../../../Domain/Entities/Contract";

@controller("/contracts")
export class ContractController implements interfaces.Controller {
  constructor(
    @inject(IocKey.AddressService)
    private addressService: IAddressService
  ) {}

  @httpGet("/")
  async index(): Promise<IApiPaginatedResponse<ContractRaw>> {
    const data = await this.addressService.findAllContracts();
    return buildPaginatedResponse({
      data: data.map((data) => data.toRaw()),
    });
  }

  @httpPost("/")
  async saveAddress(@requestBody() body: ContractRaw): Promise<IApiResponse> {
    validateOrThrowError(body, ContractSchema);

    const contract = await this.addressService.saveContract(
      Contract.create(body)
    );
    return {
      success: true,
      data: contract.toRaw(),
    };
  }
}
