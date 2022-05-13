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
import { IApiResponse, IApiResponseEmpty } from "../Types/Response";

@controller("/address")
export class AddressController implements interfaces.Controller {
  constructor(
    @inject(IocKey.AddressRepository)
    private addressRepository: IAddressRepository
  ) {}
  @httpGet("/")
  async index(): Promise<IApiResponse<Address[]>> {
    const data = await this.addressRepository.findAll();
    return {
      success: true,
      data,
    };
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
