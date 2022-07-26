import { inject } from "inversify";
import {
  interfaces,
  controller,
  httpGet,
  queryParam,
  requestBody,
  httpPost,
} from "inversify-express-utils";
import { IocKey } from "../../../Ioc/IocKey";
import { IApiPaginatedResponse, IApiResponse } from "../Types/Response";
import { buildPaginatedResponse } from "../Utils/Response";
import { ITokenRepository } from "../../../App/Repository/ITokenRepository";
import { Token, TokenProps } from "../../../App/Entities/Token";
import { CreateTokenDto, CreateTokenDtoSchema } from "../Dto/TokenDto";
import { validateOrThrowError } from "../Utils/Validation";

@controller("/tokens")
export class TokenController implements interfaces.Controller {
  constructor(
    @inject(IocKey.TokenRepository) private tokenRepository: ITokenRepository
  ) {}

  @httpPost("/")
  async createContract(
    @requestBody() _body: CreateTokenDto
  ): Promise<IApiResponse> {
    const body = validateOrThrowError(_body, CreateTokenDtoSchema);
    const token = await this.tokenRepository.save(Token.create(body));
    return {
      success: true,
      data: token.toRaw(),
    };
  }

  @httpGet("/")
  async getAllTokens(
    @queryParam("page") _page: string,
    @queryParam("pageSize") _pageSize: string
  ): Promise<IApiPaginatedResponse<TokenProps>> {
    const { data, page, pageSize, total } = await this.tokenRepository.findAll({
      page: _page ? Number(_page) : 1,
      pageSize: _pageSize ? Number(_pageSize) : 500,
    });
    return buildPaginatedResponse({
      total,
      page,
      pageSize,
      data: data.map((token) => token.toRaw()),
    });
  }
}
