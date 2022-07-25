import { inject } from "inversify";
import {
  interfaces,
  controller,
  httpGet,
  httpPost,
  requestBody,
} from "inversify-express-utils";
import { IAddressService } from "../../../App/Interfaces/IAddressService";
import { IocKey } from "../../../Ioc/IocKey";
import { IApiPaginatedResponse, IApiResponse } from "../Types/Response";
import { buildPaginatedResponse } from "../Utils/Response";
import { validateOrThrowError } from "../../../App/Utils/Validation";
import { Wallet, WalletRaw } from "../../../App/Entities/Wallet";
import { CreateWalletDto, CreateWalletDtoSchema } from "../Dto/WalletDto";

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
  async createWallet(
    @requestBody() body: CreateWalletDto
  ): Promise<IApiResponse> {
    validateOrThrowError(body, CreateWalletDtoSchema);
    const wallet = await this.addressService.saveWallet(
      Wallet.create({ ...body, createdAt: new Date() })
    );
    return {
      success: true,
      data: wallet.toRaw(),
    };
  }
}
