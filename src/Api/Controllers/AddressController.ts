import { ethers } from "ethers";
import { inject } from "inversify";
import {
  interfaces,
  controller,
  httpGet,
  httpPost,
  requestBody,
} from "inversify-express-utils";
import { Address } from "../../Domain/Entities/Address";
import { IAddressRepository } from "../../Interfaces/Repository/IAddressRepository";
import { IocKey } from "../../Ioc/IocKey";
import {
  IApiPaginatedResponse,
  IApiResponse,
  IApiResponseEmpty,
} from "../Types/Response";
import { buildPaginatedResponse } from "../Utils/Response";

@controller("/address")
export class AddressController implements interfaces.Controller {
  constructor(
    @inject(IocKey.AddressRepository)
    private addressRepository: IAddressRepository
  ) {}
  @httpGet("/")
  async index(): Promise<IApiPaginatedResponse<Address>> {
    const data = await this.addressRepository.findAll();
    return buildPaginatedResponse({
      data,
    });
  }

  @httpPost("/")
  async saveAddress(
    @requestBody() address: Address
  ): Promise<IApiResponseEmpty> {
    await this.addressRepository.save(address);
    return {
      success: true,
    };
  }
}
