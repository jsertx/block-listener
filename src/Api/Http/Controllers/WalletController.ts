import { inject } from "inversify";
import {
  interfaces,
  controller,
  httpGet,
  httpPost,
  requestBody,
  requestParam,
} from "inversify-express-utils";
import { IAddressService } from "../../../App/Interfaces/IAddressService";
import { IocKey } from "../../../Ioc/IocKey";
import { WalletSchema } from "../../../App/Schemas/AddressSchema";
import { IApiPaginatedResponse, IApiResponse } from "../Types/Response";
import { buildPaginatedResponse } from "../Utils/Response";
import { validateOrThrowError } from "../../../App/Utils/Validation";
import { Wallet, WalletRaw } from "../../../App/Entities/Wallet";
import { ApiOperationPost, ApiPath } from "swagger-express-ts";

@ApiPath({
  path: "/wallets",
  name: "Wallets",
  security: { basicAuth: [] },
})
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

  @ApiOperationPost({
    description: "Create wallet",
    parameters: {
      body: {
        description: "New version",
        required: true,
        model: "CreateWallet",
      },
    },
    responses: {
      200: { description: "Success" },
    },
  })
  @httpPost("/")
  async createWallet(@requestBody() body: WalletRaw): Promise<IApiResponse> {
    const wallet = await this.addressService.saveWallet(
      Wallet.create({ ...body, createdAt: new Date() })
    );
    return {
      success: true,
      data: wallet.toRaw(),
    };
  }
}
