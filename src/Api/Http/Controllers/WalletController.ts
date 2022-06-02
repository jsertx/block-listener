import { inject } from "inversify";
import {
  interfaces,
  controller,
  httpGet,
  httpPost,
  requestBody,
  requestParam,
} from "inversify-express-utils";
import { IAddressService } from "../../../Domain/Interfaces/IAddressService";
import { IocKey } from "../../../Ioc/IocKey";
import { WalletSchema } from "../../../Domain/Schemas/AddressSchema";
import { IApiPaginatedResponse, IApiResponse } from "../Types/Response";
import { buildPaginatedResponse } from "../Utils/Response";
import { validateOrThrowError } from "../../../Domain/Utils/Validation";
import { Wallet, WalletRaw } from "../../../Domain/Entities/Wallet";

@controller("/wallets")
export class WalletController implements interfaces.Controller {
  constructor(
    @inject(IocKey.AddressService)
    private addressService: IAddressService
  ) {}

  @httpGet("/")
  async index(): Promise<IApiPaginatedResponse<WalletRaw>> {
    const data = await this.addressService.findAllWallets();
    return buildPaginatedResponse({
      data: data.map((data) => data.toRaw()),
    });
  }

  @httpPost("/")
  async saveAddress(@requestBody() body: WalletRaw): Promise<IApiResponse> {
    validateOrThrowError(body, WalletSchema);
    const wallet = await this.addressService.saveWallet(Wallet.create(body));
    return {
      success: true,
      data: wallet.toRaw(),
    };
  }
}
